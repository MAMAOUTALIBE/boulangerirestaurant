Vidéos de la galerie
====================

Déposez ici vos fichiers vidéo (.mp4 de préférence, H.264 + AAC, ~720p/1080p,
quelques Mo pour rester fluide sur mobile).

Pour qu'une vidéo apparaisse dans la galerie (/galerie), ajoutez une entrée
dans le tableau `items` de src/components/GallerySection.tsx :

  {
    type: "video",
    src: "/videos/ma-video.mp4",
    poster: "/images/hero-slide-grillades-turques.png",  // image affichée avant lecture
    alt: "Grillades turques au charbon",
    tag: "Coulisses",
  },

Astuce : gardez des fichiers légers (compressés) pour préserver la performance
mobile. Un poster (image) est obligatoire pour un rendu propre sur tous les écrans.
