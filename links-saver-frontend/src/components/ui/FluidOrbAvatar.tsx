import { DEFAULT_AVATAR_CONFIG, type ProfileAvatarConfig, type ProfileAvatarId } from '@/lib/profile'

const backgrounds: Record<ProfileAvatarId, string> = {
  penguin: '#FDE9DA', fox: '#FCE7DF', cat: '#ECE7FA', bear: '#F2E8DF',
  bunny: '#F7E7F0', frog: '#E5F2DF', owl: '#E3EDF6', chick: '#F8F0D9',
  lion: '#F9E9CF', tiger: '#FDE9DA', elephant: '#E4EDF2', rhino: '#E7E6EF', monkey: '#F1E6DA',
}

export function FluidOrbAvatar({ avatar = DEFAULT_AVATAR_CONFIG, className = '' }: { avatar?: ProfileAvatarConfig; className?: string }) {
  const { character: avatarId, furColor: body } = avatar
  const bg = backgrounds[avatarId]
  const ears = avatarId === 'fox' || avatarId === 'cat'
  const roundedEars = avatarId === 'bear' || avatarId === 'owl' || avatarId === 'monkey'

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`block size-full rounded-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="50" fill={bg} />
      <g transform="translate(6 6) scale(.88)">
        <ellipse cx="50" cy="91" rx="24" ry="3.4" fill="#2B2238" opacity=".1" />
        <g className="link-saver-avatar-bob">
          {ears && (
            <g fill={body}>
              <path d="M23 45 24 17Q25 12 30 17L45 31 42 40ZM77 45 76 17Q75 12 70 17L55 31 58 40Z" />
              {avatarId === 'cat' && <path d="m29 33 1-10 8 9-5 3Zm42 0-1-10-8 9 5 3Z" fill="#F4B7C4" />}
            </g>
          )}
          {roundedEars && <g fill={body}><circle cx="29" cy="31" r="12" /><circle cx="71" cy="31" r="12" /></g>}
          {avatarId === 'lion' && (
            <g className="link-saver-lion-mane">
              <path d="M50 10c8 0 13 6 18 10 8-2 15 3 15 12 8 4 10 12 6 20 6 7 4 16-3 21 2 10-4 17-14 16-5 9-13 11-22 6-8 6-17 4-22-4-10 2-17-4-16-14-8-5-10-14-5-22-6-8-3-17 4-22-1-9 5-15 14-14 6-8 15-10 25-5Z" fill="#A95627" />
              <circle cx="30" cy="35" r="10" fill={body} stroke="#85431F" strokeWidth="2" />
              <circle cx="70" cy="35" r="10" fill={body} stroke="#85431F" strokeWidth="2" />
              <circle cx="30" cy="35" r="4" fill="#F7C693" />
              <circle cx="70" cy="35" r="4" fill="#F7C693" />
            </g>
          )}
          {avatarId === 'elephant' && <g className="link-saver-elephant-ears"><ellipse cx="17" cy="52" rx="18" ry="25" fill="#7298B2" /><ellipse cx="83" cy="52" rx="18" ry="25" fill="#7298B2" /><ellipse cx="18" cy="52" rx="11" ry="17" fill={body} /><ellipse cx="82" cy="52" rx="11" ry="17" fill={body} /></g>}
          {avatarId === 'rhino' && <g fill={body}><path d="M25 38q-4-18 8-20 10 3 9 19Z" /><path d="M75 38q4-18-8-20-10 3-9 19Z" /></g>}
          {avatarId === 'bunny' && (
            <g fill={body}>
              <ellipse cx="39" cy="24" rx="9" ry="20" transform="rotate(-12 39 24)" />
              <ellipse cx="61" cy="24" rx="9" ry="20" transform="rotate(12 61 24)" />
              <ellipse cx="39" cy="23" rx="4" ry="13" fill="#F5C1D5" transform="rotate(-12 39 23)" />
              <ellipse cx="61" cy="23" rx="4" ry="13" fill="#F5C1D5" transform="rotate(12 61 23)" />
            </g>
          )}
          {avatarId === 'frog' && <g fill={body}><circle cx="34" cy="34" r="13" /><circle cx="66" cy="34" r="13" /></g>}
          {avatarId === 'chick' && <path d="M45 24Q42 12 49 14Q49 20 55 17Q53 24 57 28Z" fill="#F2A53A" />}
          <path
            d={avatarId === 'penguin'
              ? 'M50 16C70 16 80 36 80 58S70 88 50 88 20 80 20 58 30 16 50 16Z'
              : 'M50 22C72 22 84 38 84 59S70 88 50 88 16 80 16 59 28 22 50 22Z'}
            fill={body}
          />
          {avatarId === 'tiger' && <g><circle cx="29" cy="32" r="11" fill="#49352E" /><circle cx="71" cy="32" r="11" fill="#49352E" /><circle cx="29" cy="32" r="6.5" fill={body} /><circle cx="71" cy="32" r="6.5" fill={body} /></g>}
          {avatarId === 'penguin' && <path d="M50 34C40 26 26 32 28 46C29 58 36 62 36 70C36 80 42 86 50 86C58 86 64 80 64 70C64 62 71 58 72 46C74 32 60 26 50 34Z" fill="#FFF7EE" />}
          {avatarId === 'fox' && <path d="M23 58Q34 48 50 62Q66 48 77 58Q70 82 50 85Q30 82 23 58Z" fill="#FFF1E8" />}
          {avatarId === 'cat' && <path d="M30 59Q39 54 47 61Q50 66 45 69Q39 70 35 66ZM70 59Q61 54 53 61Q50 66 55 69Q61 70 65 66Z" fill="#F8F3FC" />}
          {(avatarId === 'bear' || avatarId === 'bunny') && <ellipse cx="50" cy="64" rx="19" ry="15" fill="#FFF4E9" />}
          {avatarId === 'owl' && <g fill="#F7F2E8"><circle cx="38" cy="49" r="13" /><circle cx="62" cy="49" r="13" /></g>}
          {avatarId === 'chick' && <ellipse cx="50" cy="65" rx="16" ry="18" fill="#FFF3C9" />}
          {(avatarId === 'lion' || avatarId === 'tiger') && <g fill="#FFF1D5"><ellipse cx="40" cy="62" rx="13" ry="10" /><ellipse cx="60" cy="62" rx="13" ry="10" /></g>}
          {avatarId === 'rhino' && <ellipse cx="50" cy="62" rx="24" ry="15" fill="#B9B9CA" />}
          {avatarId === 'elephant' && <g className="link-saver-elephant-trunk"><path d="M50 53c-1 12-4 21 1 27 3 5 12 3 11-3l-2-8" fill="none" stroke="#597D97" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" /><path d="M50 54c-1 12-3 20 2 25 3 3 8 2 8-3l-1-6" fill="none" stroke={body} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" /><path d="M32 68q-7 8-11 1m47-1q7 8 11 1" fill="none" stroke="#FFF3D9" strokeWidth="4" strokeLinecap="round" /></g>}
          {avatarId === 'tiger' && <g fill="none" stroke="#49352E" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"><path d="M50 23 46 34m4-11 4 11m-4-8v13M25 43l11 5m-12 4 10 2m41-11-11 5m12 4-10 2" /></g>}
          {avatarId === 'rhino' && <g stroke="#77798D" strokeWidth="1.3" strokeLinejoin="round"><path d="m43 53 7-19 8 19Z" fill="#E7E6EF" /><path d="m57 61 5-11 6 13Z" fill="#D9D9E5" /></g>}
          {avatarId === 'monkey' && <ellipse cx="50" cy="59" rx="22" ry="23" fill="#E5C39C" />}
          {avatarId === 'frog' && <path d="M34 63Q50 77 66 63" fill="none" stroke="#355C43" strokeWidth="3" strokeLinecap="round" />}
          <g className="link-saver-avatar-blink" fill="#2B2238">
            {avatar.eyes === 'happy' ? (
              <><path d="M34 51q4-6 8 0" fill="none" stroke="#2B2238" strokeWidth="3" strokeLinecap="round" /><path d="M58 51q4-6 8 0" fill="none" stroke="#2B2238" strokeWidth="3" strokeLinecap="round" /></>
            ) : avatar.eyes === 'wink' ? (
              <><ellipse cx="40" cy="49" rx="3.7" ry="4.6" /><path d="M57 51q4-6 8 0" fill="none" stroke="#2B2238" strokeWidth="3" strokeLinecap="round" /></>
            ) : avatar.eyes === 'sleepy' ? (
              <><path d="M34 50q4 4 8 0" fill="none" stroke="#2B2238" strokeWidth="3" strokeLinecap="round" /><path d="M58 50q4 4 8 0" fill="none" stroke="#2B2238" strokeWidth="3" strokeLinecap="round" /></>
            ) : avatar.eyes === 'heart' ? (
              <><path d="M40 53 35 48q-3-4 1-6 3-1 4 2 2-3 5-2 4 2 1 6Z" fill="#D94F72" /><path d="M60 53 55 48q-3-4 1-6 3-1 4 2 2-3 5-2 4 2 1 6Z" fill="#D94F72" /></>
            ) : avatarId === 'frog' ? (
              <><circle cx="34" cy="34" r="7" fill="#FFF" /><circle cx="66" cy="34" r="7" fill="#FFF" /><ellipse cx="35" cy="35" rx="3" ry="4" /><ellipse cx="65" cy="35" rx="3" ry="4" /></>
            ) : avatarId === 'owl' ? (
              <><circle cx="38" cy="49" r="4" /><circle cx="62" cy="49" r="4" /></>
            ) : (
              <><ellipse cx="40" cy="49" rx="3.7" ry="4.6" /><ellipse cx="60" cy="49" rx="3.7" ry="4.6" /></>
            )}
          </g>
          {(avatarId === 'lion' || avatarId === 'tiger' || avatarId === 'rhino') && <path d="M44 59q6 6 12 0" fill="#49352E" />}
          {avatarId === 'elephant' ? (
            avatar.mouth === 'flat' ? <path d="M54 77h6" fill="none" stroke="#2B2238" strokeWidth="2" strokeLinecap="round" />
              : avatar.mouth === 'open' ? <ellipse cx="57" cy="77" rx="2.5" ry="3.2" fill="#2B2238" />
                : avatar.mouth === 'tongue' ? <g><path d="M53 75q4 3 8 0" fill="none" stroke="#2B2238" strokeWidth="2" strokeLinecap="round" /><ellipse cx="57" cy="78" rx="2" ry="2.2" fill="#E87988" /></g>
                  : <path d="M53 75q4 3 8 0" fill="none" stroke="#2B2238" strokeWidth="2" strokeLinecap="round" />
          ) : avatar.mouth === 'smile' ? (
            <path d={avatarId === 'lion' || avatarId === 'tiger' || avatarId === 'rhino' ? 'M44 68q6 6 12 0' : 'M44 62q6 6 12 0'} fill="none" stroke="#543B3B" strokeWidth="2.4" strokeLinecap="round" />
          ) : avatar.mouth === 'open' ? (
            <ellipse cx="50" cy={avatarId === 'lion' || avatarId === 'tiger' || avatarId === 'rhino' ? 69 : 64} rx="4.2" ry="5.2" fill="#543B3B" />
          ) : avatar.mouth === 'tongue' ? (
            <g><path d="M44 62q6 6 12 0" fill="none" stroke="#543B3B" strokeWidth="2.4" strokeLinecap="round" /><ellipse cx="50" cy="67" rx="2.5" ry="3" fill="#E87988" /></g>
          ) : (
            <path d="M46 64h8" fill="none" stroke="#543B3B" strokeWidth="2.4" strokeLinecap="round" />
          )}
          {avatar.accessory === 'glasses' && <g fill="none" stroke="#2B2238" strokeWidth="2.4"><circle cx="40" cy="49" r="8" /><circle cx="60" cy="49" r="8" /><path d="M48 49h4m-24 0h4m24 0h4" strokeLinecap="round" /></g>}
          {avatar.accessory === 'cap' && <g fill={body}><path d="M29 36q2-18 21-18t21 18Z" /><path d="M28 36q22-4 46 2-3 5-24 5-17 0-22-7Z" fill="#2B2238" opacity=".18" /></g>}
          {avatar.accessory === 'bow' && <g fill="#D94F72"><path d="M50 27q-13-15-17-5 0 10 17 8Zm0 0q13-15 17-5 0 10-17 8Z" /><circle cx="50" cy="26" r="3.5" fill="#A93659" /></g>}
          {avatarId === 'lion' && <g fill="#B96D2D"><circle cx="34" cy="76" r="3" /><circle cx="42" cy="81" r="3" /><circle cx="50" cy="83" r="3" /><circle cx="58" cy="81" r="3" /><circle cx="66" cy="76" r="3" /></g>}
          {avatarId === 'cat' && <g fill="none" stroke="#6E5C95" strokeWidth="1.4" strokeLinecap="round"><path d="m29 63-9-2m10 5-9 2m60-5 9-2m-10 5 9 2" /></g>}
          {avatarId === 'penguin' && <g fill="#FFA63D"><ellipse cx="42" cy="88" rx="6" ry="2.6" /><ellipse cx="58" cy="88" rx="6" ry="2.6" /></g>}
        </g>
      </g>
    </svg>
  )
}
