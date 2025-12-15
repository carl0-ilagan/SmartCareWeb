"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Stethoscope,
  User,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WelcomeSidebar } from "@/components/welcome-sidebar"

export default function InformationPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("about")
  const searchParams = useSearchParams()

  useEffect(() => {
    const section = searchParams.get("section")
    if (section) {
      setActiveSection(section)
    }
  }, [searchParams])

  const sections = [
    { id: "about", label: "About Us" },
    { id: "services", label: "Our Services" },
    { id: "doctors", label: "Our Doctors" },
    { id: "contact", label: "Contact Us" },
    { id: "terms", label: "Terms of Service" },
    { id: "privacy", label: "Privacy Policy" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onSidebarOpen={() => setIsSidebarOpen(true)} />
      <WelcomeSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-[250px_1fr]">
          {/* Sidebar Navigation */}
          <div className="rounded-lg border border-earth-beige bg-white p-4 shadow-sm md:sticky md:top-24 md:self-start">
            <h2 className="mb-4 text-lg font-semibold text-graphite">Information</h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/information?section=${section.id}`}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    activeSection === section.id
                      ? "bg-pale-stone font-medium text-soft-amber"
                      : "text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                  }`}
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="rounded-lg border border-earth-beige bg-white p-6 shadow-sm">
            {activeSection === "about" && <AboutSection />}
            {activeSection === "services" && <ServicesSection />}
            {activeSection === "doctors" && <DoctorsSection />}
            {activeSection === "contact" && <ContactSection />}
            {activeSection === "terms" && <TermsSection />}
            {activeSection === "privacy" && <PrivacySection />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function AboutSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-graphite">About Smart Care</h1>

      <div className="relative mb-8 overflow-hidden rounded-lg">
        <img src="/placeholder.svg?height=400&width=800" alt="Smart Care Team" className="h-auto w-full object-cover" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-graphite">Our Mission</h2>
        <p className="text-drift-gray">
          At Smart Care, our mission is to make healthcare accessible, convenient, and personalized for everyone. We
          believe that quality healthcare should not be limited by geographical boundaries or time constraints. Through
          our innovative telehealth platform, we connect patients with healthcare professionals, enabling virtual
          consultations, prescription management, and continuous care from the comfort of your home.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-graphite">Our Story</h2>
        <p className="text-drift-gray">
          Smart Care was founded in 2020 by a team of healthcare professionals and technology experts who recognized the
          need for a more accessible and efficient healthcare system. What started as a small telehealth service has
          grown into a comprehensive platform serving thousands of patients and healthcare providers across the country.
        </p>
        <p className="text-drift-gray">
          Our journey began with a simple question: How can we make healthcare more accessible to everyone? The answer
          led us to develop a platform that leverages technology to break down barriers to healthcare access, while
          maintaining the highest standards of medical care and patient privacy.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-graphite">Our Values</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-earth-beige p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-soft-amber/20">
              <Heart className="h-5 w-5 text-soft-amber" />
            </div>
            <h3 className="mb-1 font-medium text-graphite">Patient-Centered Care</h3>
            <p className="text-sm text-drift-gray">
              We put patients at the center of everything we do, ensuring their needs, preferences, and values guide our
              decisions.
            </p>
          </div>
          <div className="rounded-lg border border-earth-beige p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-soft-amber/20">
              <Shield className="h-5 w-5 text-soft-amber" />
            </div>
            <h3 className="mb-1 font-medium text-graphite">Privacy & Security</h3>
            <p className="text-sm text-drift-gray">
              We maintain the highest standards of data privacy and security to protect our patients' sensitive health
              information.
            </p>
          </div>
          <div className="rounded-lg border border-earth-beige p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-soft-amber/20">
              <CheckCircle className="h-5 w-5 text-soft-amber" />
            </div>
            <h3 className="mb-1 font-medium text-graphite">Quality & Excellence</h3>
            <p className="text-sm text-drift-gray">
              We are committed to providing the highest quality of care through continuous improvement and innovation.
            </p>
          </div>
          <div className="rounded-lg border border-earth-beige p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-soft-amber/20">
              <User className="h-5 w-5 text-soft-amber" />
            </div>
            <h3 className="mb-1 font-medium text-graphite">Inclusivity & Accessibility</h3>
            <p className="text-sm text-drift-gray">
              We strive to make healthcare accessible to everyone, regardless of location, mobility, or socioeconomic
              status.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/signup"
          className="inline-flex items-center rounded-md bg-soft-amber px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
        >
          Join Smart Care Today
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}

function ServicesSection() {
  const services = [
    {
      id: "consultations",
      title: "Virtual Consultations",
      description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
      icon: <MessageSquare className="h-10 w-10 text-soft-amber" />,
      features: [
        "On-demand or scheduled appointments",
        "Secure video conferencing platform",
        "Access to specialists across multiple disciplines",
        "Follow-up consultations and continuous care",
      ],
    },
    {
      id: "prescriptions",
      title: "Prescription Management",
      description: "Manage your medications with ease through our digital prescription service.",
      icon: <Stethoscope className="h-10 w-10 text-soft-amber" />,
      features: [
        "Electronic prescriptions sent directly to your preferred pharmacy",
        "Medication reminders and refill notifications",
        "Comprehensive medication history",
        "Interaction checks for medication safety",
      ],
    },
    {
      id: "monitoring",
      title: "Health Monitoring",
      description: "Track your health metrics and share them with your healthcare providers for better care.",
      icon: <Heart className="h-10 w-10 text-soft-amber" />,
      features: [
        "Integration with wearable devices and health apps",
        "Customizable health dashboards",
        "Trend analysis and health insights",
        "Automated alerts for concerning changes",
      ],
    },
    {
      id: "records",
      title: "Medical Records",
      description: "Access your complete medical history in one secure location.",
      icon: <CheckCircle className="h-10 w-10 text-soft-amber" />,
      features: [
        "Centralized storage of medical documents",
        "Secure sharing with healthcare providers",
        "Appointment history and visit summaries",
        "Lab results and diagnostic reports",
      ],
    },
    {
      id: "support",
      title: "24/7 Support",
      description: "Get medical advice and support whenever you need it.",
      icon: <Clock className="h-10 w-10 text-soft-amber" />,
      features: [
        "Round-the-clock access to healthcare professionals",
        "Emergency triage and guidance",
        "Mental health support",
        "Technical assistance with platform features",
      ],
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-graphite">Our Services</h1>
        <p className="mt-2 text-drift-gray">
          Smart Care offers a comprehensive range of telehealth services designed to make healthcare accessible,
          convenient, and personalized for everyone.
        </p>
      </div>

      {services.map((service) => (
        <div
          key={service.id}
          id={service.id}
          className="scroll-mt-24 space-y-4 rounded-lg border border-earth-beige p-6"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-soft-amber/20 p-4">{service.icon}</div>
            <div>
              <h2 className="text-2xl font-semibold text-graphite">{service.title}</h2>
              <p className="text-drift-gray">{service.description}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-medium text-graphite">Key Features:</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-soft-amber" />
                  <span className="text-drift-gray">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <div className="rounded-lg bg-pale-stone p-6">
        <h2 className="mb-4 text-xl font-semibold text-graphite">Ready to experience our services?</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-soft-amber px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            Sign Up Now
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-earth-beige bg-white px-6 py-3 text-base font-medium text-graphite shadow-sm transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}

function DoctorsSection() {
  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      experience: "15+ years",
      education: "Harvard Medical School",
      bio: "Dr. Johnson is a board-certified cardiologist with over 15 years of experience in treating heart conditions. She specializes in preventive cardiology and heart failure management.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Dr. Michael Chen",
      specialty: "Dermatologist",
      experience: "12+ years",
      education: "Johns Hopkins University",
      bio: "Dr. Chen is a dermatologist specializing in skin cancer detection and treatment. He has published numerous research papers on innovative dermatological treatments.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Dr. Emily Rodriguez",
      specialty: "Neurologist",
      experience: "10+ years",
      education: "Stanford University",
      bio: "Dr. Rodriguez specializes in treating neurological disorders including migraines, epilepsy, and multiple sclerosis. She is passionate about improving quality of life for patients with chronic neurological conditions.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Dr. David Kim",
      specialty: "Pediatrician",
      experience: "8+ years",
      education: "Yale School of Medicine",
      bio: "Dr. Kim is a pediatrician dedicated to providing comprehensive care for children from infancy through adolescence. He has a special interest in childhood development and preventive care.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Dr. Lisa Patel",
      specialty: "Psychiatrist",
      experience: "14+ years",
      education: "Columbia University",
      bio: "Dr. Patel specializes in treating anxiety, depression, and PTSD. She takes a holistic approach to mental health, combining medication management with therapeutic techniques.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Dr. James Wilson",
      specialty: "Orthopedist",
      experience: "20+ years",
      education: "University of Pennsylvania",
      bio: "Dr. Wilson is an orthopedic surgeon specializing in sports medicine and joint replacement. He has worked with professional athletes and has extensive experience in minimally invasive surgical techniques.",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-graphite">Our Doctors</h1>
        <p className="mt-2 text-drift-gray">
          Smart Care partners with highly qualified healthcare professionals across various specialties. Our doctors are
          board-certified, experienced, and committed to providing exceptional care through our telehealth platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor, index) => (
          <div
            key={index}
            className="flex flex-col rounded-lg border border-earth-beige bg-white overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <div className="h-48 overflow-hidden">
              <img src={doctor.image || "/placeholder.svg"} alt={doctor.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h2 className="text-xl font-semibold text-graphite">{doctor.name}</h2>
              <p className="text-soft-amber">{doctor.specialty}</p>
              <div className="mt-2 space-y-1 text-sm text-drift-gray">
                <p>
                  <span className="font-medium">Experience:</span> {doctor.experience}
                </p>
                <p>
                  <span className="font-medium">Education:</span> {doctor.education}
                </p>
              </div>
              <p className="mt-3 flex-1 text-sm text-drift-gray">{doctor.bio}</p>
              <div className="mt-4">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-pale-stone p-6 text-center">
        <h2 className="text-xl font-semibold text-graphite">Join Our Network of Healthcare Professionals</h2>
        <p className="mt-2 text-drift-gray">
          Are you a healthcare provider interested in joining Smart Care? We're always looking for qualified
          professionals to expand our network.
        </p>
        <div className="mt-4">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-md bg-soft-amber px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            Apply as a Provider
            <Stethoscope className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ContactSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-graphite">Contact Us</h1>
        <p className="mt-2 text-drift-gray">
          Have questions or need assistance? We're here to help. Reach out to our team through any of the methods below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6 rounded-lg border border-earth-beige p-6">
          <h2 className="text-xl font-semibold text-graphite">Get in Touch</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-soft-amber/20 p-2">
                <MapPin className="h-5 w-5 text-soft-amber" />
              </div>
              <div>
                <h3 className="font-medium text-graphite">Address</h3>
                <p className="text-drift-gray">123 Healthcare Avenue, Medical District, CA 90210</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-soft-amber/20 p-2">
                <Phone className="h-5 w-5 text-soft-amber" />
              </div>
              <div>
                <h3 className="font-medium text-graphite">Phone</h3>
                <p className="text-drift-gray">+1 (555) 123-4567</p>
                <p className="text-sm text-drift-gray">Monday - Friday, 8am - 8pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-soft-amber/20 p-2">
                <Mail className="h-5 w-5 text-soft-amber" />
              </div>
              <div>
                <h3 className="font-medium text-graphite">Email</h3>
                <p className="text-drift-gray">contact@smartcare.com</p>
                <p className="text-sm text-drift-gray">We'll respond within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 font-medium text-graphite">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-earth-beige p-6">
          <h2 className="mb-4 text-xl font-semibold text-graphite">Send Us a Message</h2>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-graphite">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-md border border-earth-beige bg-white px-3 py-2 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-graphite">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-earth-beige bg-white px-3 py-2 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  placeholder="Your email"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="mb-1 block text-sm font-medium text-graphite">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                className="w-full rounded-md border border-earth-beige bg-white px-3 py-2 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                placeholder="Subject of your message"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-graphite">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-md border border-earth-beige bg-white px-3 py-2 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                placeholder="Your message"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-soft-amber px-4 py-2 text-center font-medium text-white shadow-sm transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-pale-stone p-6">
        <h2 className="mb-4 text-xl font-semibold text-graphite">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-earth-beige bg-white p-4">
            <h3 className="font-medium text-graphite">How do I schedule an appointment?</h3>
            <p className="mt-1 text-sm text-drift-gray">
              You can schedule an appointment by logging into your account, selecting a healthcare provider, and
              choosing an available time slot that works for you.
            </p>
          </div>
          <div className="rounded-lg border border-earth-beige bg-white p-4">
            <h3 className="font-medium text-graphite">Is my medical information secure?</h3>
            <p className="mt-1 text-sm text-drift-gray">
              Yes, we take data security very seriously. All medical information is encrypted and stored securely in
              compliance with HIPAA regulations.
            </p>
          </div>
          <div className="rounded-lg border border-earth-beige bg-white p-4">
            <h3 className="font-medium text-graphite">How do virtual consultations work?</h3>
            <p className="mt-1 text-sm text-drift-gray">
              Virtual consultations take place through our secure video platform. You'll receive a link to join the call
              at your scheduled appointment time. Make sure your device has a camera and microphone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TermsSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-graphite">Terms of Service</h1>
      <p className="text-drift-gray">Last Updated: April 7, 2023</p>

      <div className="prose prose-stone max-w-none text-drift-gray">
        <p>
          Welcome to Smart Care. These Terms of Service ("Terms") govern your use of the Smart Care platform, website,
          and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by
          these Terms.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by
          these Terms. If you do not agree to these Terms, you may not access or use the Services.
        </p>

        <h2>2. Description of Services</h2>
        <p>
          Smart Care provides a telehealth platform that connects patients with healthcare providers for virtual
          consultations, prescription management, and other healthcare services. The Services are not intended to
          replace in-person medical care and should not be used in emergency situations.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          To access certain features of the Services, you must create an account. You are responsible for maintaining
          the confidentiality of your account credentials and for all activities that occur under your account. You
          agree to provide accurate and complete information when creating your account and to update your information
          as necessary.
        </p>

        <h2>4. Privacy</h2>
        <p>
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal
          information. By using the Services, you consent to the collection and use of your information as described in
          our Privacy Policy.
        </p>

        <h2>5. User Conduct</h2>
        <p>
          You agree to use the Services only for lawful purposes and in accordance with these Terms. You agree not to:
        </p>
        <ul>
          <li>Use the Services in any way that violates applicable laws or regulations</li>
          <li>
            Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity
          </li>
          <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
          <li>Attempt to gain unauthorized access to any portion of the Services</li>
          <li>Use the Services for any fraudulent or illegal purpose</li>
        </ul>

        <h2>6. Healthcare Providers</h2>
        <p>
          Healthcare providers on the Smart Care platform are independent professionals and are not employees or agents
          of Smart Care. Smart Care does not practice medicine and does not interfere with the practice of medicine by
          healthcare providers.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Smart Care shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or
          indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of the
          Services.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. If we make material changes to these Terms, we will notify you by email
          or by posting a notice on our website. Your continued use of the Services after such notification constitutes
          your acceptance of the modified Terms.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may terminate or suspend your access to the Services immediately, without prior notice or liability, for
          any reason, including if you breach these Terms. Upon termination, your right to use the Services will
          immediately cease.
        </p>

        <h2>10. Contact Information</h2>
        <p>If you have any questions about these Terms, please contact us at legal@smartcare.com.</p>
      </div>
    </div>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-graphite">Privacy Policy</h1>
      <p className="text-drift-gray">Last Updated: April 7, 2023</p>

      <div className="prose prose-stone max-w-none text-drift-gray">
        <p>
          At Smart Care, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our platform, website, and services (collectively, the
          "Services").
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect several types of information from and about users of our Services, including:</p>
        <ul>
          <li>
            <strong>Personal Information:</strong> This includes your name, email address, phone number, date of birth,
            address, and other identifiers.
          </li>
          <li>
            <strong>Health Information:</strong> This includes medical history, symptoms, diagnoses, treatments,
            medications, and other health-related information you provide or that is generated through your use of the
            Services.
          </li>
          <li>
            <strong>Payment Information:</strong> This includes credit card details, billing address, and other
            financial information necessary for processing payments.
          </li>
          <li>
            <strong>Usage Information:</strong> This includes information about how you use our Services, such as the
            pages you visit, the time and duration of your visits, and the actions you take.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect for various purposes, including:</p>
        <ul>
          <li>Providing and improving our Services</li>
          <li>Processing and fulfilling your requests</li>
          <li>Communicating with you about your account and our Services</li>
          <li>Personalizing your experience</li>
          <li>Analyzing usage patterns to improve our Services</li>
          <li>Complying with legal obligations</li>
        </ul>

        <h2>3. How We Share Your Information</h2>
        <p>We may share your information with:</p>
        <ul>
          <li>
            <strong>Healthcare Providers:</strong> We share your health information with the healthcare providers you
            consult through our Services.
          </li>
          <li>
            <strong>Service Providers:</strong> We may share your information with third-party service providers who
            perform services on our behalf, such as payment processing, data analysis, and customer service.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in
            response to valid requests by public authorities.
          </li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your information from unauthorized
          access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or
          method of electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>5. Your Rights</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information, such as:</p>
        <ul>
          <li>The right to access your personal information</li>
          <li>The right to correct inaccurate or incomplete information</li>
          <li>The right to delete your personal information</li>
          <li>The right to restrict or object to processing</li>
          <li>The right to data portability</li>
        </ul>

        <h2>6. Children's Privacy</h2>
        <p>
          Our Services are not intended for children under the age of 18. We do not knowingly collect personal
          information from children under 18. If you are a parent or guardian and believe that your child has provided
          us with personal information, please contact us.
        </p>

        <h2>7. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email
          or by posting a notice on our website prior to the changes becoming effective.
        </p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@smartcare.com.</p>
      </div>
    </div>
  )
}
