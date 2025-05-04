import type React from "react"
import { MessageSquare, Cog, FileText, ShieldCheck } from "lucide-react"

export function LandingFeatures() {
  return (
    <section id="features" className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Everything you need to diagnose and repair vehicles efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10 text-primary" />}
            title="AI Diagnostic Chatbot"
            description="Enter symptoms or OBD codes and receive possible causes in real-time"
          />
          <FeatureCard
            icon={<Cog className="h-10 w-10 text-primary" />}
            title="Smart Parts Predictor"
            description="Automatically predict necessary parts based on the diagnosis"
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Repair Order Summarizer"
            description="Generate clear, customer-friendly summaries of repair work"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-10 w-10 text-primary" />}
            title="Secure Authentication"
            description="JWT-based authentication for security and personalization"
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
