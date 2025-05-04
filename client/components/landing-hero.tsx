import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                AI-Powered Auto Diagnostics
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Detect Auto uses artificial intelligence to diagnose car problems, predict necessary parts, and generate
                repair summaries.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden shadow-xl">
              <img
                src="/placeholder.svg?height=500&width=800"
                alt="Car diagnostic interface"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
