import { createContext, useContext, useState } from 'react';

export type Profile = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  locked: boolean;
};

export const PROFILES: Profile[] = [
  { id: '1', name: 'Min-ho',  emoji: '🧑‍💻', color: '#1a3a5c', locked: false },
  { id: '2', name: 'Ji-soo',  emoji: '👩‍🎨', color: '#5c1a3a', locked: false },
  { id: '3', name: 'Kids',    emoji: '🧸',   color: '#3a5c1a', locked: false },
  { id: '4', name: 'Guest',   emoji: '👤',   color: '#2f2f2f', locked: true  },
];

type ProfileCtx = {
  activeProfile: Profile;
  setActiveProfile: (p: Profile) => void;
};

const ProfileContext = createContext<ProfileCtx>({
  activeProfile: PROFILES[0],
  setActiveProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<Profile>(PROFILES[0]);
  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
