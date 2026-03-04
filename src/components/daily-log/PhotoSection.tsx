import { useRef, useState } from 'react';
import { Camera, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DailyLogPhoto, useDailyLogPhotos, useUploadDailyLogPhoto,
  useDeleteDailyLogPhoto, useUpdatePhotoCaption,
} from '@/hooks/useDailyLog';
import { SignedImage } from '@/components/daily-log/SignedImage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { compressImage } from '@/lib/image-utils';

interface PhotoSectionProps {
  dailyLogId: string | undefined;
}

export function PhotoSection({ dailyLogId }: PhotoSectionProps) {
  const { data: photos = [] } = useDailyLogPhotos(dailyLogId);
  const upload = useUploadDailyLogPhoto();
  const deleteMut = useDeleteDailyLogPhoto();
  const updateCaption = useUpdatePhotoCaption();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<DailyLogPhoto | null>(null);
  const [caption, setCaption] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !dailyLogId) return;
    if (raw.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    try {
      const file = await compressImage(raw);
      upload.mutate(
        { dailyLogId, file },
        {
          onSuccess: () => toast.success('Photo uploaded!'),
          onError: () => toast.error('Upload failed'),
        }
      );
    } catch {
      toast.error('Failed to process image');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const openLightbox = (photo: DailyLogPhoto) => {
    setSelected(photo);
    setCaption(photo.caption || '');
  };

  const saveCaption = () => {
    if (!selected) return;
    updateCaption.mutate(
      { id: selected.id, caption },
      { onSuccess: () => { toast.success('Caption saved'); setSelected(null); } }
    );
  };

  if (!dailyLogId) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Save the day first to attach photos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">📸 Photos</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="h-8 gap-1.5"
        >
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          Add Photo
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <button
              key={p.id}
              onClick={() => openLightbox(p)}
              className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <SignedImage storagePath={p.storage_path} alt={p.caption || 'Photo'} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <SignedImage
                storagePath={selected.storage_path}
                alt={selected.caption || 'Photo'}
                className="w-full rounded-lg max-h-[60vh] object-contain"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={saveCaption} disabled={updateCaption.isPending}>
                  Save
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => {
                  deleteMut.mutate(selected, {
                    onSuccess: () => { toast.success('Photo deleted'); setSelected(null); },
                    onError: () => toast.error('Failed to delete'),
                  });
                }}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Photo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
