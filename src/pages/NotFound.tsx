import { Link } from "react-router-dom";
import { PixlMascot } from "@/components/PixlMascot";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

const NotFound = () => (
  <Layout>
    <div className="container py-24 text-center">
      <PixlMascot mood="sleep" size={140} className="mx-auto mb-6" />
      <div className="font-pixel text-4xl text-gradient-neon mb-4">404</div>
      <h1 className="font-display font-bold text-3xl mb-2">This pixel is unclaimed</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Nothing painted here yet. Head back to the canvas and stake your territory.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          asChild
          className="bg-gradient-neon glow-primary text-primary-foreground rounded-xl h-12 px-6 font-semibold"
        >
          <Link to="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl h-12 px-6">
          <Link to="/canvas">Enter canvas</Link>
        </Button>
      </div>
    </div>
  </Layout>
);

export default NotFound;
