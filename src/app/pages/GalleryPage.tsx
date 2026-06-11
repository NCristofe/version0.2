import React, { useState } from 'react';
import { Heart, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface Photo {
  id: string;
  url: string;
  caption: string;
}

const initialPhotos: Photo[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1699726252091-8b1f0d621d00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGNvdXBsZSUyMHBob3RvfGVufDF8fHx8MTc3NTgyNTczMXww&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Nossa primeira foto juntos 💕',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1675260832247-8b8393b34a4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBob2xkaW5nJTIwaGFuZHMlMjBzdW5zZXR8ZW58MXx8fHwxNzc1NzY3NzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Pôr do sol inesquecível ❤️',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1760669345703-930cd212b219?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGRpbm5lciUyMGRhdGUlMjBuaWdodHxlbnwxfHx8fDE3NzU4MjU3MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Nosso jantar especial 🍷',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1766735325744-d5bcfc3d925a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBiZWFjaCUyMHZhY2F0aW9ufGVufDF8fHx8MTc3NTgyNDI3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Férias na praia 🏖️',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1634268014879-ec7b2c982c5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBsb3ZlJTIwaGVhcnR8ZW58MXx8fHwxNzc1ODI1NzMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Te amo infinito 💖',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1549934159-af720506e2bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMHBpY25pYyUyMGNvdXBsZXxlbnwxfHx8fDE3NzU4MTAxNjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    caption: 'Piquenique romântico 🧺',
  },
];

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Camera className="w-8 h-8 text-primary" />
          <h1 className="text-4xl text-primary">Galeria</h1>
        </div>
        <p className="text-muted-foreground">Nossos momentos especiais 📸</p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4">
        {initialPhotos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-lg group"
          >
            <ImageWithFallback
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm">{photo.caption}</p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              className="absolute top-3 right-3"
            >
              <Heart className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption}
                  className="w-full h-auto"
                />
              </div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-center"
              >
                <p className="text-white text-lg px-4">{selectedPhoto.caption}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
