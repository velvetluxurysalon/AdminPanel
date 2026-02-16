import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../../firebaseConfig';


// ============================================
// HERO SECTION MANAGEMENT
// ============================================

export interface HeroContent {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  updatedAt?: any;
}

export const getHeroContent = async (): Promise<HeroContent | null> => {
  try {
    const docRef = doc(db, 'websiteContent', 'hero');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as HeroContent : null;
  } catch (error) {
    console.error('Error fetching hero content:', error);
    throw error;
  }
};

export const updateHeroContent = async (content: HeroContent): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent', 'hero');
    await setDoc(docRef, {
      ...content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating hero content:', error);
    throw error;
  }
};

// ============================================
// SERVICES MANAGEMENT
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  category: string;
  featured: boolean;
  updatedAt?: any;
}

export const getServices = async (): Promise<Service[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/services/items'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const getFeaturedServices = async (): Promise<Service[]> => {
  try {
    const services = await getServices();
    return services.filter(s => s.featured).slice(0, 4);
  } catch (error) {
    console.error('Error fetching featured services:', error);
    throw error;
  }
};

export const addService = async (service: Omit<Service, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/services/items'), {
      ...service,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

export const updateService = async (id: string, service: Partial<Service>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/services/items', id);
    await updateDoc(docRef, {
      ...service,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/services/items', id));
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// ============================================
// TEAM MEMBERS MANAGEMENT
// ============================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  experience: string;
  bio: string;
  image: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  updatedAt?: any;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/team/members'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

export const addTeamMember = async (member: Omit<TeamMember, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/team/members'), {
      ...member,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
};

export const updateTeamMember = async (id: string, member: Partial<TeamMember>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/team/members', id);
    await updateDoc(docRef, {
      ...member,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};

export const deleteTeamMember = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/team/members', id));
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
};

// ============================================
// GALLERY MANAGEMENT
// ============================================

export interface GalleryImage {
  id: string;
  image: string;
  title: string;
  description?: string;
  updatedAt?: any;
}

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/gallery/images'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GalleryImage[];
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

export const addGalleryImage = async (image: Omit<GalleryImage, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/gallery/images'), {
      ...image,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding gallery image:', error);
    throw error;
  }
};

export const updateGalleryImage = async (id: string, image: Partial<GalleryImage>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/gallery/images', id);
    await updateDoc(docRef, {
      ...image,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/gallery/images', id));
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    throw error;
  }
};

// ============================================
// TESTIMONIALS MANAGEMENT
// ============================================

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  image: string;
  rating: number;
  updatedAt?: any;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/testimonials/items'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimonial[];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    throw error;
  }
};

export const addTestimonial = async (testimonial: Omit<Testimonial, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/testimonials/items'), {
      ...testimonial,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }
};

export const updateTestimonial = async (id: string, testimonial: Partial<Testimonial>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/testimonials/items', id);
    await updateDoc(docRef, {
      ...testimonial,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/testimonials/items', id));
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};

// ============================================
// FAQ MANAGEMENT
// ============================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  updatedAt?: any;
}

export interface FAQMetadata {
  title: string;
  description: string;
  updatedAt?: any;
}

export const getFAQMetadata = async (): Promise<FAQMetadata | null> => {
  try {
    const docRef = doc(db, 'websiteContent', 'faqs-metadata');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as FAQMetadata : null;
  } catch (error) {
    console.error('Error fetching FAQ metadata:', error);
    throw error;
  }
};

export const updateFAQMetadata = async (metadata: FAQMetadata): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent', 'faqs-metadata');
    await setDoc(docRef, {
      ...metadata,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating FAQ metadata:', error);
    throw error;
  }
};

export const getFAQs = async (): Promise<FAQ[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/faqs/items'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FAQ[];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
};

export const addFAQ = async (faq: Omit<FAQ, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/faqs/items'), {
      ...faq,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding FAQ:', error);
    throw error;
  }
};

export const updateFAQ = async (id: string, faq: Partial<FAQ>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/faqs/items', id);
    await updateDoc(docRef, {
      ...faq,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }
};

export const deleteFAQ = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/faqs/items', id));
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    throw error;
  }
};


// ============================================
// IMAGE UPLOAD SERVICE
// ============================================

export const uploadImage = async (file: File, folder: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `websiteContent/${folder}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// ============================================
// BLOG MANAGEMENT
// ============================================

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  published: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/blog/posts'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BlogPost[];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

export const addBlogPost = async (post: Omit<BlogPost, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/blog/posts'), {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding blog post:', error);
    throw error;
  }
};

export const updateBlogPost = async (id: string, post: Partial<BlogPost>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/blog/posts', id);
    await updateDoc(docRef, {
      ...post,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/blog/posts', id));
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};

// ============================================
// SPECIAL OFFERS MANAGEMENT
// ============================================

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  image: string;
  validFrom: any;
  validTo: any;
  active: boolean;
  updatedAt?: any;
}

export const getSpecialOffers = async (): Promise<SpecialOffer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'websiteContent/offers/items'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SpecialOffer[];
  } catch (error) {
    console.error('Error fetching special offers:', error);
    throw error;
  }
};

export const addSpecialOffer = async (offer: Omit<SpecialOffer, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'websiteContent/offers/items'), {
      ...offer,
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding special offer:', error);
    throw error;
  }
};

export const updateSpecialOffer = async (id: string, offer: Partial<SpecialOffer>): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent/offers/items', id);
    await updateDoc(docRef, {
      ...offer,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating special offer:', error);
    throw error;
  }
};

export const deleteSpecialOffer = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'websiteContent/offers/items', id));
  } catch (error) {
    console.error('Error deleting special offer:', error);
    throw error;
  }
};

// ============================================
// CONTACT & LOCATION MANAGEMENT
// ============================================

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  updatedAt?: any;
}

export const getContactInfo = async (): Promise<ContactInfo | null> => {
  try {
    const docRef = doc(db, 'websiteContent', 'contact');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as ContactInfo : null;
  } catch (error) {
    console.error('Error fetching contact info:', error);
    throw error;
  }
};

export const updateContactInfo = async (info: ContactInfo): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent', 'contact');
    await setDoc(docRef, {
      ...info,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    throw error;
  }
};

// ============================================
// NEWSLETTER SECTION MANAGEMENT
// ============================================

export interface NewsletterContent {
  heading: string;
  subtitle: string;
  inputPlaceholder: string;
  buttonText: string;
  privacyText: string;
  stats: {
    subscribers: string;
    subscribersLabel: string;
    discount: string;
    discountLabel: string;
    frequency: string;
    frequencyLabel: string;
  };
  updatedAt?: any;
}

export const getNewsletterContent = async (): Promise<NewsletterContent | null> => {
  try {
    const docRef = doc(db, 'websiteContent', 'newsletter');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as NewsletterContent : null;
  } catch (error) {
    console.error('Error fetching newsletter content:', error);
    throw error;
  }
};

export const updateNewsletterContent = async (content: NewsletterContent): Promise<void> => {
  try {
    const docRef = doc(db, 'websiteContent', 'newsletter');
    await setDoc(docRef, {
      ...content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating newsletter content:', error);
    throw error;
  }
};
