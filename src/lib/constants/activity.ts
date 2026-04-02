export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'concern' | 'achievement' | 'kudos' | 'status';
  content: string;
  timestamp: string; // ISO string
  likesCount: number;
  isLiked: boolean;
}

export const DUMMY_ACTIVITIES: ActivityItem[] = [
  // Internal API Platform (Project 1)
  {
    id: "act-1",
    projectId: "1",
    userId: "u1",
    userName: "Alex Rivera",
    userAvatar: "https://i.pravatar.cc/150?u=1",
    type: "achievement",
    content: "Successfully deployed the new edge-auth service to 3 global regions with <10ms latency overhead.",
    timestamp: "2026-04-02T08:30:00Z",
    likesCount: 12,
    isLiked: true,
  },
  {
    id: "act-2",
    projectId: "1",
    userId: "u2",
    userName: "Sarah Chen",
    userAvatar: "https://i.pravatar.cc/150?u=2",
    type: "concern",
    content: "Observing sporadic rate-limiting issues in the Singapore region. Investigating the worker node scaling logic.",
    timestamp: "2026-04-02T09:15:00Z",
    likesCount: 2,
    isLiked: false,
  },
  {
    id: "act-3",
    projectId: "1",
    userId: "u3",
    userName: "Michael Song",
    userAvatar: "https://i.pravatar.cc/150?u=3",
    type: "kudos",
    content: "Huge thanks to Sarah for quickly identifying the regional scaling bug. Realy saved us during the peak traffic hour!",
    timestamp: "2026-04-02T10:00:00Z",
    likesCount: 8,
    isLiked: true,
  },
  
  // Security Audit 2026 (Project 2)
  {
    id: "act-5",
    projectId: "2",
    userId: "u10",
    userName: "Devon Lane",
    userAvatar: "https://i.pravatar.cc/150?u=10",
    type: "achievement",
    content: "Completed the initial security scan of all S3 buckets. 100% compliance achieved on encryption-at-rest.",
    timestamp: "2026-04-02T11:20:00Z",
    likesCount: 5,
    isLiked: false,
  },
  {
    id: "act-6",
    projectId: "2",
    userId: "u11",
    userName: "Bessie Cooper",
    userAvatar: "https://i.pravatar.cc/150?u=11",
    type: "kudos",
    content: "Great job on the S3 scan, Devon! Clean report always makes me happy.",
    timestamp: "2026-04-02T12:05:00Z",
    likesCount: 3,
    isLiked: true,
  },

  // Dashboard UI Revamp (Project 3)
  {
    id: "act-7",
    projectId: "3",
    userId: "u20",
    userName: "Guy Hawkins",
    userAvatar: "https://i.pravatar.cc/150?u=20",
    type: "achievement",
    content: "Finalized the Glassmorphism theme implementation for the main dashboard shell.",
    timestamp: "2026-04-02T07:45:00Z",
    likesCount: 15,
    isLiked: true,
  },
  {
    id: "act-8",
    projectId: "3",
    userId: "u21",
    userName: "Eleanor Pena",
    userAvatar: "https://i.pravatar.cc/150?u=21",
    type: "achievement",
    content: "Added full accessibility coverage (WCAG 2.1) to the new navigation components.",
    timestamp: "2026-04-02T09:30:00Z",
    likesCount: 9,
    isLiked: false,
  },
];
