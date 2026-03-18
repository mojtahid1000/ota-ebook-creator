import Link from "next/link";
import { BookOpen, Sparkles, FileText, Image, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-gradient-to-br from-ota-blue to-ota-blue-dark text-white">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ota-orange rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">OTA Ebook Creator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/80 hover:text-white transition"
            >
              লগইন
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm py-2 px-4 rounded-lg bg-ota-orange hover:bg-ota-orange-dark"
            >
              ফ্রি শুরু করুন
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            এআই দিয়ে প্রফেশনাল
            <span className="text-ota-orange"> ইবুক </span>
            তৈরি করুন
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            নিশ সিলেক্ট করুন, টার্গেট অডিয়েন্স বাছাই করুন, এবং ১২টি
            এআই এজেন্ট আপনার জন্য সম্পূর্ণ ইবুক লিখে দেবে — টপিক বাই
            টপিক!
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-ota-orange hover:bg-ota-orange-dark
                       text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            ফ্রিতে ইবুক তৈরি শুরু করুন
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-ota-blue mb-12">
          কিভাবে কাজ করে?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "১২টি এআই এজেন্ট",
              desc: "প্রতিটি ধাপে একটি বিশেষজ্ঞ এআই এজেন্ট কাজ করে - নিশ রিসার্চ থেকে কভার ডিজাইন পর্যন্ত",
            },
            {
              icon: FileText,
              title: "টপিক বাই টপিক",
              desc: "প্রতিটি টপিক আলাদাভাবে লেখা হয়। আপনি কনফার্ম করলেই পরের টপিক শুরু হবে",
            },
            {
              icon: Image,
              title: "PDF, DOCX & কভার",
              desc: "প্রফেশনাল PDF, Word ডকুমেন্ট এবং এআই-জেনারেটেড কভার ডিজাইন",
            },
          ].map((feature, i) => (
            <div key={i} className="card text-center">
              <div className="w-14 h-14 bg-ota-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-ota-orange" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ota-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            আজই আপনার প্রথম ইবুক তৈরি করুন
          </h2>
          <p className="text-white/70 mb-8">
            ফ্রি প্ল্যানে প্রতি মাসে ১টি ইবুক তৈরি করতে পারবেন
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-ota-orange hover:bg-ota-orange-dark
                       text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
          >
            ফ্রি সাইন আপ
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Online Tech Academy (OTA) |
            www.onlinetechacademy.com | @mentormojtahid
          </p>
        </div>
      </footer>
    </div>
  );
}
