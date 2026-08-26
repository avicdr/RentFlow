'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Send, Building2, User, Loader2,
  Clock, Shield,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function TenantMessagesPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: profileRes } = useQuery({
    queryKey: ['tenant-message-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
  });

  const { data: convData } = useQuery({
    queryKey: ['tenant-conversations'],
    queryFn: () => apiClient.get('/api/v1/messages/conversations').then(r => r.data.data),
    refetchInterval: 4000,
  });

  const profile = profileRes;
  const conversations = convData ?? [];
  const activeConv = conversations[0];

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['tenant-chat-messages', activeConv?._id],
    queryFn: () => apiClient.get(`/api/v1/messages/conversations/${activeConv._id}`).then(r => r.data.data),
    enabled: !!activeConv?._id,
    refetchInterval: 3000,
  });

  // Mutation
  const { mutate: sendMessage, isPending: sending } = useMutation({
    mutationFn: (data: { conversationId?: string; receiverId?: string; propertyId?: string; content: string }) =>
      apiClient.post('/api/v1/messages/send', data),
    onSuccess: () => {
      setMessageText('');
      qc.invalidateQueries({ queryKey: ['tenant-chat-messages'] });
      qc.invalidateQueries({ queryKey: ['tenant-conversations'] });
    },
  });

  const messages = messagesData ?? [];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const landlord = profile?.landlordId;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landlord Communication</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Direct real-time chat with your property manager
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 min-h-0 bg-card rounded-3xl border border-border overflow-hidden flex flex-col shadow-sm">
        {/* Chat Header */}
        <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {landlord?.firstName?.[0] || 'L'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {landlord?.firstName ? `${landlord.firstName} ${landlord.lastName}` : 'Property Landlord'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {profile?.propertyId?.name ?? 'Property Manager'} · Room {profile?.roomId?.roomNumber ?? ''}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Shield className="h-3 w-3" /> Official Channel
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-background">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground text-xs space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-1">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground text-sm">Start of conversation</p>
              <p className="max-w-xs">Have a question regarding rent, amenities, or maintenance? Send your message below.</p>
            </div>
          ) : (
            messages.map((m: any) => {
              const isMe = String(m.senderId?._id || m.senderId || '') === String((currentUser as any)?._id || currentUser?.id || '');
              return (
                <div key={m._id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none border border-border',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!messageText.trim()) return;
              sendMessage({
                conversationId: activeConv?._id,
                receiverId: !activeConv ? (landlord?._id || profile?.landlordId?._id) : undefined,
                propertyId: profile?.propertyId?._id,
                content: messageText.trim(),
              });
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Type your message to landlord..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="flex-1 h-11 text-sm bg-background"
            />
            <Button type="submit" disabled={sending || !messageText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-5 rounded-xl font-semibold">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
