import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Inbox, Loader2, MessageSquare, Send, ShoppingBag } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar.jsx';
import SmartImage from '../components/SmartImage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatINR, timeAgo } from '../utils/format';

export default function Messages() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [params] = useSearchParams();
  const productFilter = params.get('product');
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('inbox');
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadThreads = () => {
    setLoadingThreads(true);
    const url = tab === 'inbox' ? '/messages/inbox' : '/messages/sent';
    api
      .get(url)
      .then(({ data }) => setThreads(data.data.threads))
      .catch((err) => setThreadsError(getErrorMessage(err)))
      .finally(() => setLoadingThreads(false));
  };

  useEffect(loadThreads, [tab]);

  useEffect(() => {
    if (!userId) {
      setConversation(null);
      return;
    }
    let active = true;
    setLoadingConversation(true);
    const query = productFilter ? `?product=${productFilter}` : '';
    api
      .get(`/messages/conversation/${userId}${query}`)
      .then(({ data }) => {
        if (active) setConversation(data.data);
      })
      .catch((err) => active && toast.error(getErrorMessage(err)))
      .finally(() => active && setLoadingConversation(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, productFilter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [conversation?.messages?.length]);

  const openThread = (thread) => {
    navigate(`/messages/${thread.other._id}?product=${thread.product._id}`);
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const text = reply.trim();
    if (!text) {
      toast.error('Write a message first.');
      return;
    }
    if (!conversation?.product) {
      toast.error('This conversation is not linked to a listing.');
      return;
    }
    setSending(true);
    try {
      await api.post('/messages', {
        receiver: conversation.other._id,
        product: conversation.product._id,
        message: text,
      });
      setReply('');
      const query = productFilter ? `?product=${productFilter}` : '';
      const { data } = await api.get(`/messages/conversation/${conversation.other._id}${query}`);
      setConversation(data.data);
      toast.success('Message sent.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Messages</h1>
            <p>Private conversations between buyers and sellers. Contact details stay hidden.</p>
          </div>
          <Link to="/products" className="btn btn--outline">
            <ShoppingBag size={16} /> Browse listings
          </Link>
        </div>

        <div className="messages-layout">
          <aside className="thread-panel">
            <div className="thread-panel__head">
              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${tab === 'inbox' ? 'is-active' : ''}`}
                  onClick={() => setTab('inbox')}
                >
                  Inbox
                </button>
                <button
                  type="button"
                  className={`tab ${tab === 'sent' ? 'is-active' : ''}`}
                  onClick={() => setTab('sent')}
                >
                  Sent
                </button>
              </div>
            </div>

            <div className="thread-list">
              {loadingThreads ? (
                <LoadingSpinner label="Loading conversations…" small />
              ) : threadsError ? (
                <div className="empty-block">{threadsError}</div>
              ) : threads.length === 0 ? (
                <div className="empty-block">
                  {tab === 'inbox'
                    ? 'No inquiries yet. When a buyer messages you about a listing, it appears here.'
                    : 'You have not contacted any sellers yet.'}
                </div>
              ) : (
                threads.map((thread) => {
                  const active =
                    String(thread.other._id) === String(userId) &&
                    (!productFilter || String(thread.product._id) === String(productFilter));
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      className={`thread-item ${active ? 'is-active' : ''}`}
                      onClick={() => openThread(thread)}
                    >
                      <Avatar user={thread.other} size="sm" />
                      <div className="thread-item__body">
                        <div className="thread-item__top">
                          <strong>{thread.other.name}</strong>
                          <time>{timeAgo(thread.lastAt)}</time>
                        </div>
                        <div className="thread-item__product">{thread.product.title}</div>
                        <div className="thread-item__preview">
                          {thread.lastSender === user?._id ? 'You: ' : ''}
                          {thread.lastMessage}
                        </div>
                      </div>
                      {thread.unread > 0 && <span className="thread-item__unread">{thread.unread}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="chat">
            {!userId ? (
              <div className="chat__empty">
                <MessageSquare size={34} />
                <h3 style={{ margin: 0 }}>Select a conversation</h3>
                <p style={{ margin: 0 }}>
                  Choose a thread from the {tab} to read the full history and reply. Messages about a listing include
                  the item and price for context.
                </p>
              </div>
            ) : loadingConversation ? (
              <LoadingSpinner label="Loading conversation…" />
            ) : conversation ? (
              <>
                <div className="chat__head">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => navigate('/messages')}
                    aria-label="Back to conversation list"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <Avatar user={conversation.other} size="sm" />
                  <div>
                    <h3>{conversation.other.name}</h3>
                    <p>
                      {conversation.other.department} · {conversation.other.college}
                    </p>
                  </div>
                  {conversation.product && (
                    <Link to={`/products/${conversation.product._id}`} className="chat__product">
                      {conversation.product.images?.[0] && (
                        <SmartImage
                          src={conversation.product.images[0].url}
                          alt=""
                          style={{ width: 22, height: 22, borderRadius: 4 }}
                        />
                      )}
                      {conversation.product.title} · {formatINR(conversation.product.price)}
                    </Link>
                  )}
                </div>

                <div className="chat__messages">
                  {conversation.messages.length === 0 ? (
                    <div className="chat__empty">
                      <Inbox size={28} />
                      <p style={{ margin: 0 }}>No messages in this conversation yet. Say hello!</p>
                    </div>
                  ) : (
                    conversation.messages.map((message) => {
                      const outgoing = String(message.sender?._id) === String(user?._id);
                      return (
                        <div key={message._id} className={`bubble ${outgoing ? 'bubble--out' : 'bubble--in'}`}>
                          {message.message}
                          <time>{timeAgo(message.createdAt)}</time>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form className="chat__composer" onSubmit={sendReply}>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={`Reply to ${conversation.other.name.split(' ')[0]}…`}
                    maxLength={1200}
                    aria-label="Message"
                  />
                  <button type="submit" className="btn btn--primary" disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 size={16} /> : <Send size={16} />} Send
                  </button>
                </form>
              </>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Conversation unavailable"
                description="This conversation could not be loaded. It may belong to another student."
                action={
                  <button type="button" className="btn btn--primary" onClick={() => navigate('/messages')}>
                    Back to inbox
                  </button>
                }
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
