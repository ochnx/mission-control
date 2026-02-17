'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Pencil,
  Trash2,
  X,
  Save,
  Link2,
  Clock,
  Eye,
  TrendingUp,
  MessageSquare,
  Mail,
  Bot,
  User2,
  Building2,
  FolderOpen,
  Briefcase,
  Home,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import type { Memory, MemoryEntity } from '@/types';
import { cn } from '@/lib/utils';

const categories: Memory['category'][] = ['Decisions', 'Learnings', 'Rules', 'People', 'Projects'];

const categoryColors: Record<string, string> = {
  Decisions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Learnings: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Rules: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  People: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Projects: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const sourceIcons: Record<string, React.ReactNode> = {
  manual: <User2 className="w-3 h-3" />,
  telegram: <MessageSquare className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  agent: <Bot className="w-3 h-3" />,
};

const entityIcons: Record<string, React.ReactNode> = {
  person: <User2 className="w-3 h-3" />,
  company: <Building2 className="w-3 h-3" />,
  project: <FolderOpen className="w-3 h-3" />,
  deal: <Briefcase className="w-3 h-3" />,
  property: <Home className="w-3 h-3" />,
};

interface MemoryDetailPanelProps {
  memory: Memory;
  entities: MemoryEntity[];
  relatedMemories: Memory[];
  onUpdated: () => void;
  onDeleted: () => void;
  onSelectMemory: (id: string) => void;
}

export function MemoryDetailPanel({
  memory,
  entities,
  relatedMemories,
  onUpdated,
  onDeleted,
  onSelectMemory,
}: MemoryDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(memory.content || '');
  const [category, setCategory] = useState<Memory['category']>(memory.category);
  const [tagsInput, setTagsInput] = useState((memory.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [addingEntity, setAddingEntity] = useState(false);
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<MemoryEntity['entity_type']>('person');

  useEffect(() => {
    setContent(memory.content || '');
    setCategory(memory.category);
    setTagsInput((memory.tags || []).join(', '));
    setEditing(false);
    setAddingEntity(false);
  }, [memory.id, memory.content, memory.category, memory.tags]);

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await supabase
      .from('mc_memories')
      .update({ content: content.trim(), category, tags })
      .eq('id', memory.id);

    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_memories').delete().eq('id', memory.id);
    onDeleted();
  };

  const handleAddEntity = async () => {
    if (!entityName.trim()) return;
    await supabase.from('mc_memory_entities').insert({
      memory_id: memory.id,
      entity_type: entityType,
      entity_name: entityName.trim(),
    });
    setEntityName('');
    setAddingEntity(false);
    onUpdated();
  };

  const handleRemoveEntity = async (entityId: string) => {
    await supabase.from('mc_memory_entities').delete().eq('id', entityId);
    onUpdated();
  };

  const sourceType = memory.source_type || 'manual';

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn('text-xs', categoryColors[memory.category])}
            >
              {memory.category}
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              {sourceIcons[sourceType]}
              {sourceType}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="resize-y"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Memory['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Linked Entities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Linked Entities
            </h4>
            {!addingEntity && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setAddingEntity(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          {addingEntity && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Entity name..."
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddEntity(); }}
                />
              </div>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as MemoryEntity['entity_type'])}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={handleAddEntity} disabled={!entityName.trim()}>
                <Link2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setAddingEntity(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {entities.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {entities.map((entity) => (
                <Badge
                  key={entity.id}
                  variant="outline"
                  className="gap-1.5 text-xs cursor-default group/entity"
                >
                  {entityIcons[entity.entity_type]}
                  {entity.entity_name}
                  <button
                    onClick={() => handleRemoveEntity(entity.id)}
                    className="opacity-0 group-hover/entity:opacity-100 transition-opacity ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            !addingEntity && (
              <p className="text-xs text-muted-foreground">No linked entities yet</p>
            )
          )}
        </div>

        <Separator />

        {/* Related Memories */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Related Memories
          </h4>
          {relatedMemories.length > 0 ? (
            <div className="space-y-2">
              {relatedMemories.map((rm) => (
                <button
                  key={rm.id}
                  onClick={() => onSelectMemory(rm.id)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="text-xs line-clamp-2">{rm.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className={cn('text-[10px] py-0', categoryColors[rm.category])}>
                      {rm.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(rm.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No related memories found
            </p>
          )}
        </div>

        <Separator />

        {/* Access Stats */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Stats
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{format(new Date(memory.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3 shrink-0" />
              <span>{memory.access_count ?? 0} views</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>{(memory.relevance_score ?? 1).toFixed(1)} score</span>
            </div>
          </div>
          {memory.last_accessed_at && (
            <p className="text-[10px] text-muted-foreground">
              Last accessed {formatDistanceToNow(new Date(memory.last_accessed_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
