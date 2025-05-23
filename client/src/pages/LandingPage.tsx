import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  ChevronRight, 
  Database, 
  LineChart, 
  Brain, 
  BarChart2, 
  PieChart, 
  Sparkles,
  ArrowRight,
  FileBarChart, 
  MessageSquare,
  Zap,
  ArrowDown
} from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView, useSpring } from 'framer-motion';
import { AuthHeader } from '@/components/auth';
import { useRef, useState, useEffect } from 'react';

export default function LandingPage() {
  // Refs for scrolling effects
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  
  // Scroll animation values
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Parallax effect for hero section
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.9]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);
  
  // Perspective effect for 3D transformation
  const perspective = useTransform(scrollY, [0, 1000], [1000, 2000]);
  const rotateX = useTransform(scrollY, [0, 500], [0, 10]);
  const rotateY = useTransform(scrollY, [0, 500], [0, -5]);
  
  // Mouse parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to the center of the screen
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 100 };
  const mouseX = useSpring(mousePosition.x, springConfig);
  const mouseY = useSpring(mousePosition.y, springConfig);
  return (
    <div 
      ref={containerRef}
      className="flex flex-col min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/80"
    >
      {/* Navigation */}
      <header className="glassmorphism backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/20">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gradient text-lg">DataLysis</span>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors hover-lift">Features</a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors hover-lift">How It Works</a>
              <a href="#examples" className="text-sm font-medium hover:text-primary transition-colors hover-lift">Examples</a>
            </nav>
            <AuthHeader />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="py-20 md:py-32 relative overflow-hidden"
        style={{
          y: heroY,
          scale: heroScale,
          opacity: heroOpacity
        }}
      >
        {/* Background decorative elements */}
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"
          style={{
            x: useTransform(mouseX, [-20, 20], [-15, 15]),
            y: useTransform(mouseY, [-20, 20], [-15, 15]),
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow"
          style={{
            x: useTransform(mouseX, [-20, 20], [15, -15]),
            y: useTransform(mouseY, [-20, 20], [15, -15]),
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            className="flex flex-col lg:flex-row items-center gap-12"
            style={{
              perspective: perspective,
              transformStyle: "preserve-3d"
            }}
          >
            <motion.div 
              className="lg:w-1/2 space-y-6"
              style={{
                rotateX: useTransform(mouseY, [-20, 20], [2, -2]),
                rotateY: useTransform(mouseX, [-20, 20], [-2, 2]),
              }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  AI-Powered Excel Analysis
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Transform Your <span className="text-gradient font-extrabold">Data</span> Into <span className="text-gradient font-extrabold">Insights</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-xl">
                  Upload your Excel files and let our AI analyze, visualize, and extract valuable insights automatically. No coding required.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/app">
                  <Button size="lg" className="group btn-futuristic">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="group hover-lift">
                    Learn More
                    <ArrowDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
                  </Button>
                </a>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Powered by advanced domain-specific AI models</span>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:w-1/2 relative"
              style={{
                rotateY: useTransform(mouseX, [-20, 20], [5, -5]),
                rotateX: useTransform(mouseY, [-20, 20], [-5, 5]),
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                perspective: 1000,
                z: 10,
              }}
            >
              <motion.div 
                className="relative glassmorphism rounded-xl border border-gray-200/20 shadow-xl overflow-hidden"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                  perspective: 1000,
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"
                  style={{
                    x: useTransform(mouseX, [-20, 20], [-5, 5]),
                    y: useTransform(mouseY, [-20, 20], [-5, 5]),
                  }}
                ></motion.div>
                <motion.img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Data Analysis Dashboard" 
                  className="w-full h-auto relative z-10 mix-blend-luminosity opacity-90"
                  style={{
                    scale: useTransform(scrollYProgress, [0, 0.5], [1, 0.9]),
                  }}
                />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center z-20 opacity-90"
                  style={{
                    y: useTransform(mouseY, [-20, 20], [-10, 10]),
                    x: useTransform(mouseX, [-20, 20], [-10, 10]),
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-primary/40 flex items-center justify-center">
                      <LineChart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Floating Features */}
              <motion.div 
                className="absolute -top-5 -left-5 glassmorphism p-3 rounded-lg border border-gray-200/20 flex items-center gap-2 shadow-lg animate-float"
                style={{
                  z: 20,
                  x: useTransform(mouseX, [-20, 20], [-10, 0]),
                  y: useTransform(mouseY, [-20, 20], [0, -10]),
                }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Smart Domain Detection</span>
              </motion.div>
              
              <motion.div 
                className="absolute top-1/2 -right-5 glassmorphism p-3 rounded-lg border border-gray-200/20 flex items-center gap-2 shadow-lg animate-float-delayed"
                style={{
                  z: 20,
                  x: useTransform(mouseX, [-20, 20], [0, -10]),
                  y: useTransform(mouseY, [-20, 20], [-5, 5]),
                }}
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium">Auto-generated Visualizations</span>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-5 left-1/3 glassmorphism p-3 rounded-lg border border-gray-200/20 flex items-center gap-2 shadow-lg animate-float-slow"
                style={{
                  z: 20,
                  x: useTransform(mouseX, [-20, 20], [-5, 5]),
                  y: useTransform(mouseY, [-20, 20], [5, -5]),
                }}
              >
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-medium">Natural Language Queries</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        ref={featuresRef}
        id="features" 
        className="py-20 relative"
        style={{
          position: "relative",
        }}
      >
        <motion.div 
          className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.1, 0.3], [100, -100]),
            opacity: useTransform(scrollYProgress, [0.1, 0.2, 0.3], [0, 1, 0]),
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.1, 0.3], [-100, 100]),
            opacity: useTransform(scrollYProgress, [0.1, 0.2, 0.3], [0, 1, 0]),
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
              Powerful Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Smart Analysis for Any Excel File
            </h2>
            <p className="text-lg text-gray-400">
              Our AI-powered platform automatically detects your data domain and applies specialized analysis techniques.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.0 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <Brain className="h-6 w-6 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Smart Domain Detection</h3>
              <p className="text-gray-400">
                Our AI automatically detects whether your data is financial, sales, marketing, HR, or other domains.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <LineChart className="h-6 w-6 text-accent" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Smart Visualizations</h3>
              <p className="text-gray-400">
                Domain-specific charts and graphs are automatically generated based on your data patterns.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <MessageSquare className="h-6 w-6 text-success" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Natural Language Queries</h3>
              <p className="text-gray-400">
                Ask questions about your data in plain English and get instant insights and visualizations.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Preprocessing Tools</h3>
              <p className="text-gray-400">
                Automatically clean, transform, and prepare your data before analysis.
              </p>
            </motion.div>
            
            {/* Feature 5 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <FileBarChart className="h-6 w-6 text-accent" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Reports</h3>
              <p className="text-gray-400">
                Get detailed insights reports that identify trends, anomalies, and opportunities in your data.
              </p>
            </motion.div>
            
            {/* Feature 6 */}
            <motion.div 
              className="glassmorphism rounded-xl p-6 border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                rotateX: 5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-4"
                style={{ 
                  transformStyle: "preserve-3d",
                  z: 10,
                  rotateX: useTransform(mouseY, [-20, 20], [5, -5]),
                  rotateY: useTransform(mouseX, [-20, 20], [-5, 5])
                }}
              >
                <Database className="h-6 w-6 text-success" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Cloud Storage</h3>
              <p className="text-gray-400">
                Securely store your Excel files and analysis results in the cloud for easy access.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        ref={howItWorksRef}
        id="how-it-works" 
        className="py-20 relative"
        style={{
          position: "relative",
        }}
      >
        <motion.div 
          className="absolute -top-40 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.3, 0.5], [-100, 100]),
            opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.5], [0, 1, 0]),
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute -bottom-40 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.3, 0.5], [100, -100]),
            opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.5], [0, 1, 0]),
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-400">
              Turn your Excel files into insights in just a few steps
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-success hidden md:block"></div>
            
            <div className="space-y-12 md:space-y-24 relative">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center md:space-x-8">
                <div className="md:w-1/2 md:text-right order-2 md:order-1">
                  <h3 className="text-2xl font-bold mb-2">Upload Your Data</h3>
                  <p className="text-gray-400 max-w-md md:ml-auto">
                    Simply drag and drop your Excel or CSV files onto our platform.
                  </p>
                </div>
                <div className="flex items-center justify-center md:w-14 mt-4 md:mt-0 order-1 md:order-2 relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center z-10">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-primary/20 animate-ping-slow"></div>
                </div>
                <div className="md:w-1/2 mt-4 md:mt-0 order-3">
                  <img 
                    src="https://images.unsplash.com/photo-1623282033815-40b05d96c903?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Uploading data" 
                    className="w-full h-auto rounded-lg shadow-lg glassmorphism border border-gray-200/20"
                  />
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-center md:space-x-8">
                <div className="md:w-1/2 mt-4 md:mt-0 order-2">
                  <img 
                    src="https://images.unsplash.com/photo-1577401152102-2896dff440a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="AI analyzing data" 
                    className="w-full h-auto rounded-lg shadow-lg glassmorphism border border-gray-200/20"
                  />
                </div>
                <div className="flex items-center justify-center md:w-14 mt-4 md:mt-0 order-1 relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center z-10">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-accent/20 animate-ping-slow"></div>
                </div>
                <div className="md:w-1/2 md:text-left order-3">
                  <h3 className="text-2xl font-bold mb-2">AI Analyzes Domain</h3>
                  <p className="text-gray-400 max-w-md">
                    Our AI automatically detects your data's domain and applies specialized analysis models.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center md:space-x-8">
                <div className="md:w-1/2 md:text-right order-2 md:order-1">
                  <h3 className="text-2xl font-bold mb-2">Review Insights</h3>
                  <p className="text-gray-400 max-w-md md:ml-auto">
                    Explore automatically generated visualizations and insights tailored to your data domain.
                  </p>
                </div>
                <div className="flex items-center justify-center md:w-14 mt-4 md:mt-0 order-1 md:order-2 relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success to-success/60 flex items-center justify-center z-10">
                    <LineChart className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-success/20 animate-ping-slow"></div>
                </div>
                <div className="md:w-1/2 mt-4 md:mt-0 order-3">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Data insights and visualizations" 
                    className="w-full h-auto rounded-lg shadow-lg glassmorphism border border-gray-200/20"
                  />
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col md:flex-row items-center md:space-x-8">
                <div className="md:w-1/2 mt-4 md:mt-0 order-2">
                  <img 
                    src="https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="AI answering questions" 
                    className="w-full h-auto rounded-lg shadow-lg glassmorphism border border-gray-200/20"
                  />
                </div>
                <div className="flex items-center justify-center md:w-14 mt-4 md:mt-0 order-1 relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center z-10">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-primary/20 animate-ping-slow"></div>
                </div>
                <div className="md:w-1/2 md:text-left order-3">
                  <h3 className="text-2xl font-bold mb-2">Ask Questions</h3>
                  <p className="text-gray-400 max-w-md">
                    Query your data using natural language and get instant answers with supporting visualizations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Example Results Section */}
      <motion.section 
        ref={examplesRef}
        id="examples" 
        className="py-20 relative"
        style={{
          position: "relative",
        }}
      >
        <motion.div 
          className="absolute top-40 -right-20 w-96 h-96 bg-success/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.5, 0.8], [-50, 100]),
            opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.8], [0, 1, 0]),
            scale: useTransform(scrollYProgress, [0.5, 0.7], [0.8, 1.2]),
          }}
        ></motion.div>
        
        <motion.div 
          className="absolute -bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          style={{
            x: useTransform(scrollYProgress, [0.5, 0.8], [50, -100]),
            opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.8], [0, 1, 0]),
            scale: useTransform(scrollYProgress, [0.5, 0.7], [0.8, 1.2]),
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success mb-4">
              Example Results
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See What DataLysis Can Do
            </h2>
            <p className="text-lg text-gray-400">
              Examples of insights and visualizations from real-world data
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Example 1 */}
            <motion.div 
              className="glassmorphism rounded-xl overflow-hidden border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 5,
                rotateX: -2,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ 
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
            >
              <motion.div 
                className="h-48 overflow-hidden"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <motion.img 
                  src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Financial Analysis" 
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    rotateX: useTransform(mouseY, [-20, 20], [2, -2]),
                    rotateY: useTransform(mouseX, [-20, 20], [-2, 2]),
                  }}
                />
              </motion.div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <motion.span 
                    className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(124, 58, 237, 0.2)" }}
                  >
                    Financial Data
                  </motion.span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">98% Confidence</span>
                  </div>
                </div>
                <motion.h3 
                  className="text-xl font-semibold mb-2"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [1, -1]),
                  }}
                >Expense Trend Analysis</motion.h3>
                <motion.p 
                  className="text-gray-400 text-sm mb-4"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [0.5, -0.5]),
                  }}
                >
                  Automatic detection of spending patterns, seasonal variations, and anomaly detection.
                </motion.p>
                <motion.div 
                  className="flex justify-end"
                  whileHover={{ x: 5 }}
                >
                  <Button variant="ghost" size="sm" className="text-primary hover-lift">
                    <span>View Example</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Example 2 */}
            <motion.div 
              className="glassmorphism rounded-xl overflow-hidden border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 5,
                rotateX: -2,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ 
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
            >
              <motion.div 
                className="h-48 overflow-hidden"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <motion.img 
                  src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Sales Dashboard" 
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    rotateX: useTransform(mouseY, [-20, 20], [2, -2]),
                    rotateY: useTransform(mouseX, [-20, 20], [-2, 2]),
                  }}
                />
              </motion.div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <motion.span 
                    className="text-xs font-medium px-3 py-1 rounded-full bg-accent/10 text-accent"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(6, 182, 212, 0.2)" }}
                  >
                    Sales Data
                  </motion.span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-accent" />
                    <span className="text-xs text-accent">95% Confidence</span>
                  </div>
                </div>
                <motion.h3 
                  className="text-xl font-semibold mb-2"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [1, -1]),
                  }}
                >Regional Performance</motion.h3>
                <motion.p 
                  className="text-gray-400 text-sm mb-4"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [0.5, -0.5]),
                  }}
                >
                  Sales performance breakdown by region with automatic detection of top/underperforming areas.
                </motion.p>
                <motion.div 
                  className="flex justify-end"
                  whileHover={{ x: 5 }}
                >
                  <Button variant="ghost" size="sm" className="text-accent hover-lift">
                    <span>View Example</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Example 3 */}
            <motion.div 
              className="glassmorphism rounded-xl overflow-hidden border border-gray-200/20 hover-lift transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 5,
                rotateX: -2,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              style={{ 
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
            >
              <motion.div 
                className="h-48 overflow-hidden"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <motion.img 
                  src="https://images.unsplash.com/photo-1534135954997-e58fbd6dbbfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Marketing Analytics" 
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    rotateX: useTransform(mouseY, [-20, 20], [2, -2]),
                    rotateY: useTransform(mouseX, [-20, 20], [-2, 2]),
                  }}
                />
              </motion.div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <motion.span 
                    className="text-xs font-medium px-3 py-1 rounded-full bg-success/10 text-success"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(22, 163, 74, 0.2)" }}
                  >
                    Marketing Data
                  </motion.span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">92% Confidence</span>
                  </div>
                </div>
                <motion.h3 
                  className="text-xl font-semibold mb-2"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [1, -1]),
                  }}
                >Campaign ROI Analysis</motion.h3>
                <motion.p 
                  className="text-gray-400 text-sm mb-4"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: useTransform(mouseX, [-20, 20], [0.5, -0.5]),
                  }}
                >
                  Automatic ROI calculation and performance comparison across multiple marketing campaigns.
                </motion.p>
                <motion.div 
                  className="flex justify-end"
                  whileHover={{ x: 5 }}
                >
                  <Button variant="ghost" size="sm" className="text-success hover-lift">
                    <span>View Example</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link href="/app">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" className="btn-futuristic">
                  Start Analyzing Your Data
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="py-12 border-t border-gray-200/10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center"
            style={{
              transformStyle: "preserve-3d",
              perspective: 1000,
            }}
          >
            <motion.div 
              className="flex items-center space-x-2 mb-4 md:mb-0"
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <motion.div 
                className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 5,
                  ease: "easeInOut" 
                }}
              >
                <BarChart2 className="h-5 w-5 text-white" />
              </motion.div>
              <span className="font-bold text-gradient text-lg">DataLysis</span>
            </motion.div>
            
            <motion.div 
              className="flex space-x-6 mb-4 md:mb-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.a 
                href="#features" 
                className="text-sm hover:text-primary transition-colors"
                whileHover={{ 
                  scale: 1.1,
                  color: "hsl(var(--primary))",
                  y: -2 
                }}
              >
                Features
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                className="text-sm hover:text-primary transition-colors"
                whileHover={{ 
                  scale: 1.1,
                  color: "hsl(var(--primary))",
                  y: -2 
                }}
              >
                How It Works
              </motion.a>
              <motion.a 
                href="#examples" 
                className="text-sm hover:text-primary transition-colors"
                whileHover={{ 
                  scale: 1.1,
                  color: "hsl(var(--primary))",
                  y: -2
                }}
              >
                Examples
              </motion.a>
            </motion.div>
            
            <motion.div 
              className="text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                transformStyle: "preserve-3d",
                rotateY: useTransform(mouseX, [-200, 200], [2, -2]),
              }}
            >
              &copy; {new Date().getFullYear()} DataLysis. All rights reserved.
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}