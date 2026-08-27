'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Share2,
  Code2,
  Sparkles,
  Search,
  Plus,
  Send,
  Github,
  CheckCircle2,
} from 'lucide-react';
import { DUMMY_POSTS } from '@/lib/dummyData';

export default function CommunityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>(DUMMY_POSTS);
  const [selectedTag, setSelectedTag] = useState('All');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});

    fetch('/api/feed')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) setPosts(json.data);
      })
      .catch(() => {});
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost = {
      id: `post_${Date.now()}`,
      title: newPostTitle,
      content: newPostContent,
      category: 'Architecture',
      authorName: profile?.name || 'Siddharth Kadbhane',
      authorUsername: profile?.username || 'siddharthkadbhane-pixel',
      authorAvatar: profile?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4',
      createdAt: new Date().toISOString(),
      likesCount: 1,
      commentsCount: 0,
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setIsPosting(false);
  };

  const tags = ['All', 'Architecture', 'Performance', 'Systems', 'Next.js 15', 'Rust'];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Technical Community" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          <PageHeader
            title="Technical Developer Community"
            description="High-signal technical discussions, architectural case studies, code reviews, and engineering breakthroughs."
            badge={{ text: 'High Signal', variant: 'primary' }}
          >
            <button
              onClick={() => setIsPosting(!isPosting)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Technical Post
            </button>
          </PageHeader>

          {/* New Post Form */}
          {isPosting && (
            <form
              onSubmit={handleCreatePost}
              className="bg-[#0D121A] border border-[#7C3AED]/40 rounded-xl p-5 shadow-lg space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
                Publish Technical Writeup
              </h3>
              <input
                type="text"
                placeholder="Post title (e.g., Zero-alloc buffer pooling in Rust)..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none"
              />
              <textarea
                rows={4}
                placeholder="Share your architectural insight, benchmarks, or code breakdown..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none resize-none font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Post
                </button>
              </div>
            </form>
          )}

          {/* Tag Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#0D121A] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Feed Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all shadow-sm space-y-4"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#F8FAFC]">
                          {post.authorName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        @{post.authorUsername} &bull; {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/30">
                    {post.category || 'Architecture'}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-bold text-sm text-[#F8FAFC] mb-2">{post.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Code Snippet if present */}
                {post.codeSnippet && (
                  <div className="p-3.5 rounded-lg bg-[#070A0F] border border-white/[0.06] overflow-x-auto">
                    <pre className="font-mono text-xs text-[#38BDF8] leading-relaxed">
                      <code>{post.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Interactions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-[#10B981] transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="font-mono">{post.likesCount || 14}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[#38BDF8] transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="font-mono">{post.commentsCount || 3}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[#F8FAFC] transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>

                  {post.githubLink && (
                    <a
                      href={post.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-[#A78BFA] hover:underline"
                    >
                      <Github className="w-3.5 h-3.5" />
                      View Codebase
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
