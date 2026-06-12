import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, Heart } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

export default function GalleryPage() {
  const { memories } = useAppData();
  
  // Filtra apenas memórias que tenham imagens
  const photos = memories
    .filter(m => m.imageUrls && m.imageUrls.length > 0)
    .flatMap(m => m.imageUrls?.map(url => ({ url, title: m.title, date: m.date })) || []);

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Camera className="w-8 h-8 text-primary" />
          <h1 className="text-4xl text-primary">Nossa Galeria</h1>
        </div>
        <p className="text-muted-foreground">Nossos momentos congelados no tempo ✨</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Nenhuma foto ainda.</p>
          <p className="text-xs text-muted-foreground/60">Adicione fotos ao criar uma Memória!</p>
        </div>
      ) : (
        <ResponsiveMasonry columnsCountBreakPoints={{ 350: 2, 750: 3 }}>
          <Masonry gutter="12px">
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative group overflow-hidden rounded-2xl border border-border"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-white text-[10px] font-medium truncate">{photo.title}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white/70 text-[8px]">
                      {new Date(photo.date).toLocaleDateString('pt-BR')}
                    </span>
                    <Heart className="w-3 h-3 text-primary fill-current" />
                  </div>
                </div>
              </motion.div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      )}
    </div>
  );
}