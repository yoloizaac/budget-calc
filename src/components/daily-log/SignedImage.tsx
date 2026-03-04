import { useState, useEffect } from 'react';
import { getPhotoUrl } from '@/hooks/useDailyLog';

interface SignedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  storagePath: string;
}

export function SignedImage({ storagePath, alt, ...props }: SignedImageProps) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(storagePath).then(url => {
      if (!cancelled) setSrc(url);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [storagePath]);

  if (!src) return <div className={props.className} />;
  return <img src={src} alt={alt} {...props} />;
}
