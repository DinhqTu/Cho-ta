export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export const mockUsers: User[] = [
  { id: "u1", name: "Yuki", avatar: "🧑‍🦰", color: "#FF6B6B" },
  { id: "u2", name: "Kenji", avatar: "👨", color: "#4ECDC4" },
  { id: "u3", name: "Sakura", avatar: "👩", color: "#FFE66D" },
  { id: "u4", name: "Hiro", avatar: "🧔", color: "#95E1D3" },
  { id: "u5", name: "Mei", avatar: "👧", color: "#F38181" },
  { id: "u6", name: "Takeshi", avatar: "👴", color: "#AA96DA" },
  { id: "u7", name: "Aiko", avatar: "👩‍🦱", color: "#FCBAD3" },
  { id: "u8", name: "Ryu", avatar: "🧑", color: "#A8D8EA" },
];

// Get current user (for demo, first user)
export const currentUser = mockUsers[0];
