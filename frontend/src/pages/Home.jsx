import MainLayout from "../layouts/MainLayout";
import Hero from "../components/Hero";
import Services from "../components/careerservices";
import Footer from "../components/Footer";

function Home() {
  return (
    <MainLayout>
      <Hero />
      <Services />
      <Footer />
    </MainLayout>
  );
}

export default Home;