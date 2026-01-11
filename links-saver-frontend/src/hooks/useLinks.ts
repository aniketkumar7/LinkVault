import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Link, CreateLinkInput, LinkFilters } from '@/lib/api'
import { toast } from '@/lib/toast'

// Query keys
export const queryKeys = {
  links: (filters: LinkFilters) => ['links', filters] as const,
  collections: ['collections'] as const,
  stats: ['stats'] as const,
}

// Hooks
export function useLinks(filters: LinkFilters) {
  return useQuery({
    queryKey: queryKeys.links(filters),
    queryFn: () => api.getLinks(filters),
    staleTime: 30000,
  })
}

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections,
    queryFn: api.getCollections,
    staleTime: 60000,
  })
}

export function useInvalidateCollections() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.collections })
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.getStats,
    staleTime: 30000,
  })
}

// Mutations with optimistic updates
export function useCreateLink() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateLinkInput) => api.createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      toast.success('Link saved successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save link')
    },
  })
}

export function useUpdateLink() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Link> }) => 
      api.updateLink(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['links'] })
      
      // Snapshot current state
      const previousLinks = queryClient.getQueriesData({ queryKey: ['links'] })
      
      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['links'] }, (old: Link[] | undefined) => {
        if (!old) return old
        return old.map(link => link.id === id ? { ...link, ...data } : link)
      })
      
      return { previousLinks }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      context?.previousLinks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error('Failed to update link')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.deleteLink(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['links'] })
      
      const previousLinks = queryClient.getQueriesData({ queryKey: ['links'] })
      
      // Optimistically remove
      queryClient.setQueriesData({ queryKey: ['links'] }, (old: Link[] | undefined) => {
        if (!old) return old
        return old.filter(link => link.id !== id)
      })
      
      return { previousLinks }
    },
    onError: (_err, _id, context) => {
      context?.previousLinks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error('Failed to delete link')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['links'] })
      
      const previousLinks = queryClient.getQueriesData({ queryKey: ['links'] })
      
      queryClient.setQueriesData({ queryKey: ['links'] }, (old: Link[] | undefined) => {
        if (!old) return old
        return old.map(link => 
          link.id === id ? { ...link, is_favorite: !link.is_favorite } : link
        )
      })
      
      return { previousLinks }
    },
    onError: (_err, _id, context) => {
      context?.previousLinks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

// Undo delete functionality
let deletedLink: Link | null = null
let undoTimeout: ReturnType<typeof setTimeout> | null = null

export function useDeleteWithUndo() {
  const queryClient = useQueryClient()
  const deleteMutation = useDeleteLink()
  
  const deleteWithUndo = (link: Link) => {
    deletedLink = link
    
    // Clear any existing undo timeout
    if (undoTimeout) clearTimeout(undoTimeout)
    
    // Optimistically remove
    queryClient.setQueriesData({ queryKey: ['links'] }, (old: Link[] | undefined) => {
      if (!old) return old
      return old.filter(l => l.id !== link.id)
    })
    
    // Show toast with undo
    toast('Link deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (deletedLink) {
            // Restore the link
            queryClient.setQueriesData({ queryKey: ['links'] }, (old: Link[] | undefined) => {
              if (!old) return [deletedLink!]
              return [deletedLink!, ...old]
            })
            deletedLink = null
            if (undoTimeout) clearTimeout(undoTimeout)
          }
        },
      },
    })
    
    // Actually delete after timeout
    undoTimeout = setTimeout(() => {
      if (deletedLink?.id === link.id) {
        deleteMutation.mutate(link.id)
        deletedLink = null
      }
    }, 5000)
  }
  
  return { deleteWithUndo }
}

// Batch actions
export function useBatchActions() {
  const queryClient = useQueryClient()
  
  const batchDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api.deleteLink(id)))
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      toast.success(`Deleted ${ids.length} links`)
    },
    onError: () => {
      toast.error('Failed to delete some links')
    },
  })
  
  const batchMoveToCollection = useMutation({
    mutationFn: async ({ ids, collectionId }: { ids: string[]; collectionId: string | null }) => {
      await Promise.all(ids.map(id => api.updateLink(id, { collection_id: collectionId })))
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      toast.success(`Moved ${ids.length} links`)
    },
  })
  
  return { batchDelete, batchMoveToCollection }
}

