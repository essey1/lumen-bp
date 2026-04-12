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
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/campus.png')" }}
        />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              For Berea College Students
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Your 4-year journey,{" "}
              <span className="text-primary">planned from day one</span>
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              Lumen helps you map out your entire academic path at Berea College. 
              Select your majors, explore your interests, and visualize your complete 
              course schedule — all in one place.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/planner">
                <Button size="lg" className="gap-2 text-base">
                  <Compass className="h-5 w-5" />
                  Start Planning
                </Button>
              </Link>
              <Link href="/plan">
                <Button variant="outline" size="lg" className="gap-2 text-base">
                  View Sample Plan
                </Button>
              </Link>
            </div>
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
