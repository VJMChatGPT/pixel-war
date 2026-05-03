import { Link } from "react-router-dom";
import { PixlMascot } from "@/components/PixlMascot";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

const NotFound = () => (
  <Layout>
    <div className="container py-24 text-center">
      <PixlMascot mood="shock" size={120} className="mx-auto mb-6" />
      <div className="font-pixel text-4xl text-gradient-neon mb-4">404</div>
      <h1 className="font-display font-bold text-3xl mb-2">Pixel not found</h1>
      <p className="text-muted-foreground mb-8">PIXL looked everywhere, but this page isn't on the canvas.</p>
      <Button
        asChild
        className="bg-gradient-neon glow-primary text-primary-foreground rounded-xl h-12 px-6 font-semibold"
      >
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  </Layout>
);

export default NotFound;
