import { useEffect } from 'react';
import Hero from '../sections/Hero';
import Projects from '../sections/Projects';
import About from '../sections/About';
import Skills from '../sections/Skills';
import Learning from '../sections/Learning';
import Journey from '../sections/Journey';
import Contact from '../sections/Contact';
export default function Home() {
  useEffect(() => { document.title = 'Dasun Praweena — Ideas to code. Code to impact.'; }, []);
  return <main id="main" tabIndex={-1}><Hero /><Projects /><About /><Skills /><Learning /><Journey /><Contact /></main>;
}
