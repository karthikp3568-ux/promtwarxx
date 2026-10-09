import { Lock, ExternalLink } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-white">Privacy & Data Handling</h1>
      </div>

      <div className="space-y-6">
        <Section title="How your data is processed">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>Your content is sent to our backend server and then to Google's Gemini API for analysis.
                On the free tier, Google may use submitted content to improve its products.
                <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 ml-1">
                  Google API Terms <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>The voice analysis model runs on our server, not a third-party service.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>When URL inspection is enabled, links found in your content are fetched from our server to check for redirects and suspicious destinations.</span>
            </li>
          </ul>
        </Section>

        <Section title="What we store">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>Nothing is stored on the server. Your content, files, and analysis results are processed in memory and discarded.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>Analysis history is stored only in your browser's local storage. It contains only the analysis ID, feature type, timestamp, risk score, risk level, and a brief summary — never the original content.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">•</span>
              <span>You can delete individual entries, clear all history, or turn off history entirely from the History page.</span>
            </li>
          </ul>
        </Section>

        <Section title="What TrustGuard does not do">
          <ul className="space-y-3">
            {[
              'Verify identities or access any accounts (WhatsApp, banks, payment apps)',
              'Block payments or access real-time bank data',
              'Store, execute, or render uploaded files',
              'Provide "official" contact details for any organization',
              'Claim end-to-end encryption',
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-risk-high mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
