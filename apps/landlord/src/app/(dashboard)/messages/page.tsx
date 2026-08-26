'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Send, User, Building2, Search, Loader2,
  CheckCheck, Phone, Mail, Plus, X, Home,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LandlordMessagesPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const myId = (currentUser as any)?._id || currentUser?.id;
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: convData, isLoading: loadingConvs } = useQuery({
    queryKey: ['landlord-conversations'],
    queryFn: () => apiClient.get('/api/v1/messages/conversations').then(r => r.data.data),
    refetchInterval: 4000,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-for-chat'],
    queryFn: () => apiClient.get('/api/v1/tenants', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation-messages', selectedConvId],
    queryFn: () => apiClient.get(`/api/v1/messages/conversations/${selectedConvId}`).then(r => r.data.data),
    enabled: !!selectedConvId,
    refetchInterval: 3000,
  });

  // Mutation
  const { mutate: sendMessage, isPending: sending } = useMutation({
    mutationFn: (data: { conversationId?: string | null; receiverId?: string; propertyId?: string; content: string }) =>
      apiClient.post('/api/v1/messages/send', data),
    onSuccess: (res) => {
      setMessageText('');
      const newConvId = res.data?.data?.conversationId || selectedConvId;
      if (newConvId) setSelectedConvId(newConvId);
      qc.invalidateQueries({ queryKey: ['conversation-messages', selectedConvId] });
      qc.invalidateQueries({ queryKey: ['landlord-conversations'] });
      qc.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
      setShowNewChat(false);
    },
  });

  const conversations = convData ?? [];
  const tenants = tenantsData ?? [];
  const messages = messagesData ?? [];

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0]._id);
    }
  }, [conversations, selectedConvId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c: any) => c._id === selectedConvId) || (conversations.length > 0 ? conversations[0] : null);

  // Extract other user and tenant metadata safely
  const otherUser = activeConv?.otherUser || (activeConv?.participants?.find((p: any) => String(p._id || p.id) !== String(myId)) ?? activeConv?.participants?.[0]);
  const tenantInfo = activeConv?.tenantInfo;

  // Cross-reference with tenants list in case of any partial user population
  const matchedTenant = tenants.find((t: any) => {
    const tUid = String(t.userId?._id || t.userId?.id || t.userId || '');
    const oUid = String(otherUser?._id || otherUser?.id || otherUser || '');
    const tEmail = String(t.userId?.email || '').toLowerCase();
    const oEmail = String(otherUser?.email || '').toLowerCase();
    return (tUid && oUid && tUid === oUid) || (tEmail && oEmail && tEmail === oEmail);
  });

  const tenantName = (
    (otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() : '') ||
    (matchedTenant?.userId?.firstName ? `${matchedTenant.userId.firstName} ${matchedTenant.userId.lastName || ''}`.trim() : '') ||
    otherUser?.email ||
    matchedTenant?.userId?.email ||
    'Resident'
  );

  const tenantRoom = (
    (tenantInfo?.roomNumber ? `Room ${tenantInfo.roomNumber}` : '') ||
    (matchedTenant?.roomId?.roomNumber ? `Room ${matchedTenant.roomId.roomNumber}` : '') ||
    tenantInfo?.roomType ||
    matchedTenant?.roomId?.type ||
    null
  );

  const tenantProperty = (
    tenantInfo?.propertyName ||
    matchedTenant?.propertyId?.name ||
    activeConv?.propertyId?.name ||
    null
  );

  const filteredConversations = conversations.filter((c: any) => {
    const u = c.otherUser || c.participants?.find((p: any) => String(p._id || p.id) !== String(myId));
    const name = `${u?.firstName || ''} ${u?.lastName || ''} ${u?.email || ''} ${c.tenantInfo?.propertyName || ''} ${c.tenantInfo?.roomNumber || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const filteredNewChatTenants = tenants.filter((t: any) => {
    if (!newChatSearch.trim()) return true;
    const q = newChatSearch.toLowerCase();
    const name = `${t.userId?.firstName || ''} ${t.userId?.lastName || ''} ${t.userId?.email || ''} ${t.userId?.phone || ''}`.toLowerCase();
    const room = `room ${t.roomId?.roomNumber || ''} ${t.roomId?.type || ''}`.toLowerCase();
    const prop = `${t.propertyId?.name || ''}`.toLowerCase();
    return name.includes(q) || room.includes(q) || prop.includes(q);
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMessage({
      conversationId: activeConv._id,
      content: messageText.trim(),
    });
  };

  const startChatWithTenant = (t: any) => {
    const targetUserId = t.userId?._id || t.userId?.id || t.userId;
    if (!targetUserId) return;
    sendMessage({
      receiverId: targetUserId,
      propertyId: t.propertyId?._id || t.propertyId,
      content: `Hello ${t.userId?.firstName || 'there'}! This is your property manager.`,
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenant Communication</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Direct real-time messaging with your residents
          </p>
        </div>
        <Button onClick={() => setShowNewChat(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Start Conversation
        </Button>
      </div>

      {/* Main Messaging Layout */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 shadow-sm">
        {/* Left Sidebar: Conversations List */}
        <div className="border-r border-border flex flex-col h-full bg-muted/10">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenant or room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingConvs ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
                <p>No active conversations found.</p>
                <Button onClick={() => setShowNewChat(true)} variant="outline" size="sm" className="text-xs">
                  Start Chat
                </Button>
              </div>
            ) : (
              filteredConversations.map((c: any) => {
                const u = c.otherUser || c.participants?.find((p: any) => String(p._id || p.id) !== String(myId));
                const isSelected = c._id === (selectedConvId || activeConv?._id);
                const unread = c.unreadCounts?.[myId || ''] || 0;

                const matchedT = tenants.find((t: any) => {
                  const tUid = String(t.userId?._id || t.userId?.id || t.userId || '');
                  const oUid = String(u?._id || u?.id || u || '');
                  const tEmail = String(t.userId?.email || '').toLowerCase();
                  const oEmail = String(u?.email || '').toLowerCase();
                  return (tUid && oUid && tUid === oUid) || (tEmail && oEmail && tEmail === oEmail);
                });

                const name = (
                  (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : '') ||
                  (matchedT?.userId?.firstName ? `${matchedT.userId.firstName} ${matchedT.userId.lastName || ''}`.trim() : '') ||
                  u?.email ||
                  matchedT?.userId?.email ||
                  'Tenant'
                );

                const room = (
                  (c.tenantInfo?.roomNumber ? `Room ${c.tenantInfo.roomNumber}` : '') ||
                  (matchedT?.roomId?.roomNumber ? `Room ${matchedT.roomId.roomNumber}` : '') ||
                  null
                );

                const prop = c.tenantInfo?.propertyName || matchedT?.propertyId?.name || c.propertyId?.name;

                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedConvId(c._id)}
                    className={cn(
                      'w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/60',
                      isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600' : '',
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                      {name?.[0] || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {name}
                        </p>
                        {c.lastMessage && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(c.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      {/* Room & Property Badge */}
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                        {room && <span>{room}</span>}
                        {room && prop && <span>·</span>}
                        {prop && <span className="truncate">{prop}</span>}
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full bg-background">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 px-5 border-b border-border flex items-center justify-between bg-card/60">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {tenantName?.[0] || 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{tenantName}</span>
                      {tenantRoom && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {tenantRoom}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      {tenantProperty && <span className="font-medium text-foreground">{tenantProperty}</span>}
                      {tenantProperty && (otherUser?.phone || otherUser?.email || matchedTenant?.userId?.email) && <span>·</span>}
                      <span>{otherUser?.phone || otherUser?.email || matchedTenant?.userId?.email || 'Active Resident'}</span>
                    </p>
                  </div>
                </div>

                {tenantProperty && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    <span>{tenantProperty}</span>
                  </div>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground text-xs space-y-2">
                    <MessageSquare className="h-8 w-8 opacity-40" />
                    <p>Start of conversation with {tenantName}. Send a message below.</p>
                  </div>
                ) : (
                  messages.map((m: any) => {
                    const isMe = String(m.senderId?._id || m.senderId || '') === String(myId || '');
                    return (
                      <div key={m._id} className={cn('flex flex-col max-w-[75%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
                        <div className={cn(
                          'p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-xs',
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-muted/80 text-foreground border border-border rounded-bl-none',
                        )}>
                          <p>{m.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                          {formatDate(m.createdAt)}
                          {isMe && <CheckCheck className="h-3 w-3 text-indigo-500" />}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSend} className="p-3 px-4 border-t border-border bg-card/60 flex items-center gap-2">
                <Input
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`Reply to ${tenantName}...`}
                  className="h-11 bg-background"
                />
                <Button type="submit" disabled={sending || !messageText.trim()} className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send</>}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">No conversation selected</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a tenant from the left sidebar or start a new conversation.
              </p>
              <Button onClick={() => setShowNewChat(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Start Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-base text-foreground">Start New Conversation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select a tenant to message directly</p>
              </div>
              <button
                onClick={() => { setShowNewChat(false); setNewChatSearch(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search in modal */}
            <div className="p-3 border-b border-border bg-muted/20 flex-shrink-0">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search by tenant name, room no, property..."
                  value={newChatSearch}
                  onChange={e => setNewChatSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border p-2 min-h-0">
              {filteredNewChatTenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">No tenants found</p>
                  <p>Try searching with another name, room number, or property.</p>
                </div>
              ) : (
                filteredNewChatTenants.map((t: any) => (
                  <button
                    key={t._id}
                    onClick={() => startChatWithTenant(t)}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted/60 transition-colors flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {t.userId?.firstName?.[0]}{t.userId?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {t.userId?.firstName} {t.userId?.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t.propertyId?.name} {t.roomId?.roomNumber ? `· Room ${t.roomId.roomNumber}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 hover:underline flex-shrink-0">Message →</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
