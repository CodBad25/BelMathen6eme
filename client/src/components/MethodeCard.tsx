import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MethodeCardProps {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

export default function MethodeCard({ id, title, content, icon = "📖" }: MethodeCardProps) {
  // Nettoyer le markdown Obsidian (enlever les tags, liens internes, etc.)
  const cleanContent = content
    .replace(/🏷️ \*\*Tags\*\* : .*\n/g, "")
    .replace(/📚 \*\*Chapitre\*\* : \[\[.*\]\]\n/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // Convertir [[link]] en link
    .replace(/---\n\n## 🔗 Cette méthode est utilisée dans[\s\S]*?(?=---|$)/g, "") // Enlever la section liens
    .replace(/---\n\n## 🎧 Ressources[\s\S]*?(?=---|$)/g, "") // Enlever ressources
    .replace(/---\n\n## 📝 Notes Pédagogiques[\s\S]*?(?=---|$)/g, "") // Enlever notes pédago
    .replace(/\*\*Créée le\*\*.*$/gm, "") // Enlever dates
    .replace(/\*\*Dernière modification\*\*.*$/gm, "")
    .replace(/\*\*Utilisée\*\*.*$/gm, "")
    .replace(/# M\d+\.\d+ - .*\n/g, "") // Enlever le titre H1 (on l'affiche dans le header)
    .trim();

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 prose prose-slate max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-lg font-bold text-purple-700 mt-6 mb-3 pb-2 border-b border-purple-200 flex items-center gap-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 space-y-1 mb-4">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-700">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">{children}</strong>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    <code>{children}</code>
                  </pre>
                );
              }
              return (
                <code className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-purple-100">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-purple-800">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 px-3 py-2">{children}</td>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-400 pl-4 italic text-gray-600 my-4">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-gray-200 my-4" />,
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
