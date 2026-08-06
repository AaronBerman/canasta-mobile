export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  online: boolean;
  lastSeen?: Date;
}

export interface FriendInvite {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

/** Interface for friends list — implement against your backend / GitLab auth. */
export interface FriendsService {
  listFriends(userId: string): Promise<Friend[]>;
  sendInvite(fromUserId: string, toUserId: string): Promise<FriendInvite>;
  acceptInvite(inviteId: string): Promise<Friend>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  searchUsers(query: string): Promise<Pick<Friend, 'userId' | 'displayName' | 'avatarUrl'>[]>;
}

export class InMemoryFriendsService implements FriendsService {
  private friends = new Map<string, Friend[]>();
  private invites: FriendInvite[] = [];

  async listFriends(userId: string): Promise<Friend[]> {
    return this.friends.get(userId) ?? [];
  }

  async sendInvite(fromUserId: string, toUserId: string): Promise<FriendInvite> {
    const invite: FriendInvite = {
      id: `inv_${Date.now()}`,
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date(),
    };
    this.invites.push(invite);
    return invite;
  }

  async acceptInvite(inviteId: string): Promise<Friend> {
    const invite = this.invites.find((i) => i.id === inviteId);
    if (!invite) throw new Error('Invite not found');
    invite.status = 'accepted';
    const friend: Friend = {
      userId: invite.fromUserId,
      displayName: invite.fromUserId,
      online: true,
    };
    const listA = this.friends.get(invite.toUserId) ?? [];
    listA.push(friend);
    this.friends.set(invite.toUserId, listA);
    return friend;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const list = (this.friends.get(userId) ?? []).filter((f) => f.userId !== friendId);
    this.friends.set(userId, list);
  }

  async searchUsers(query: string): Promise<Pick<Friend, 'userId' | 'displayName' | 'avatarUrl'>[]> {
    return [{ userId: query, displayName: query }];
  }
}
