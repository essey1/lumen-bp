import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Calendar, Compass, GraduationCap, Sparkles, Target } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Lumen</span>
          </div>
          <Link href="/planner">
            <Button variant="outline" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background image with dramatic Ken Burns */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-[kenburns_30s_ease-in-out_infinite]"
          style={{ backgroundImage: "url('/images/campus.png')" }}
        />
        {/* Breathing overlay that fades in and out */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background animate-[breatheOverlay_8s_ease-in-out_infinite]" />
        {/* Static gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/40" />
        
        {/* Floating decorative orbs with dramatic movement */}
        <div className="absolute top-20 left-[10%] h-32 w-32 rounded-full bg-primary/30 blur-3xl animate-[orbFloat1_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 right-[15%] h-48 w-48 rounded-full bg-primary/25 blur-3xl animate-[orbFloat2_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-[5%] h-24 w-24 rounded-full bg-accent/30 blur-2xl animate-[orbFloat3_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 left-[20%] h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-[orbFloat2_14s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[15%] right-[30%] h-20 w-20 rounded-full bg-accent/25 blur-2xl animate-[orbFloat1_9s_ease-in-out_infinite_1s]" />
        
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 bg-card/95 backdrop-blur-md px-5 py-2 text-sm font-medium text-primary animate-[fadeInDown_1s_cubic-bezier(0.16,1,0.3,1),borderGlow_3s_ease-in-out_infinite] shadow-xl">
              <GraduationCap className="h-5 w-5 animate-[floatRotate_4s_ease-in-out_infinite]" />
              For Berea College Students
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl animate-[fadeInUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
              Your 4-year journey,{" "}
              <span className="text-primary relative inline-block animate-[textGlow_4s_ease-in-out_infinite]">
                planned from day one
                <span className="absolute -inset-2 bg-primary/15 blur-xl rounded-lg animate-[pulse-glow_3s_ease-in-out_infinite]" />
              </span>
            </h1>
            <p className="mb-10 text-pretty text-lg text-foreground/90 md:text-xl animate-[fadeInUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both]">
              Lumen helps you map out your entire academic path at Berea College. 
              Select your majors, explore your interests, and visualize your complete 
              course schedule — all in one place.
            </p>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center animate-[fadeInUp_1s_cubic-bezier(0.16,1,0.3,1)_0.7s_both]">
              <Link href="/planner">
                <Button size="lg" className="gap-2 text-base px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-500 animate-[pulse-glow_3s_ease-in-out_infinite]">
                  <Compass className="h-6 w-6 animate-[spin_6s_linear_infinite]" />
                  Start Planning
                </Button>
              </Link>
              <Link href="/plan">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6 text-lg bg-card/95 backdrop-blur-md hover:bg-card hover:scale-110 transition-all duration-500 shadow-xl animate-[borderGlow_4s_ease-in-out_infinite]">
                  View Sample Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-14 w-8 rounded-full border-2 bg-card/70 backdrop-blur-sm flex items-start justify-center p-2 shadow-xl animate-[borderGlow_2s_ease-in-out_infinite]">
            <div className="h-4 w-2 rounded-full bg-primary animate-[scrollDown_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              How Lumen Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              A simple, guided process to create your personalized academic roadmap
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <Card className="border-border bg-background">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  1. Share Your Goals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tell us about your majors, minors, interests, and career aspirations 
                  through our friendly step-by-step form.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  2. Get Your Plan
                </h3>
                <p className="text-sm text-muted-foreground">
                  We generate a customized 4-year course plan that aligns with 
                  your academic goals and Berea College requirements.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  3. Visualize & Adjust
                </h3>
                <p className="text-sm text-muted-foreground">
                  See your entire academic journey laid out semester by semester, 
                  and make adjustments as needed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Ready to plan your future?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join hundreds of Berea College students who have mapped their academic journey with Lumen.
          </p>
          <Link href="/planner">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Get Started — {"It's"} Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Made with care for Berea College students</p>
        </div>
      </footer>
    </div>
  )
}
