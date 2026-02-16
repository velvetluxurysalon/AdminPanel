declare module 'react-slick' {
  import React from 'react';
  
  interface Settings {
    dots?: boolean;
    infinite?: boolean;
    speed?: number;
    slidesToShow?: number;
    slidesToScroll?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    responsive?: Array<{
      breakpoint: number;
      settings: Partial<Settings>;
    }>;
    [key: string]: any;
  }
  
  interface SliderProps {
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  const Slider: React.ComponentType<SliderProps>;
  export default Slider;
}
