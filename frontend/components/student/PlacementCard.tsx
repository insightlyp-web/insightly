// components/student/PlacementCard.tsx
import Link from "next/link";
import { Card } from "./Card";

interface PlacementPost {
  id: string;
  title: string;
  company_name: string;
  job_type: string;
  package?: string;
  deadline?: string;
  description?: string;
  required_skills?: string[];
  created_at: string;
}

interface PlacementCardProps {
  post: PlacementPost;
}

export function PlacementCard({ post }: PlacementCardProps) {
  const isDeadlinePassed = post.deadline ? new Date(post.deadline) < new Date() : false;
  const jobTypeLabel = post.job_type === "internship" ? "Internship" : "Full Time";
  const jobTypeColor = post.job_type === "internship" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
          <p className="text-sm font-medium text-gray-700">{post.company_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColor}`}>
          {jobTypeLabel}
        </span>
      </div>

      {post.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {post.required_skills?.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
          >
            {skill}
          </span>
        ))}
        {post.required_skills && post.required_skills.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
            +{post.required_skills.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {post.deadline ? (
            <>
              <span className={isDeadlinePassed ? "text-red-600 font-medium" : ""}>
                Deadline: {new Date(post.deadline).toLocaleDateString()}
              </span>
              {post.package && <span className="ml-4">Package: {post.package}</span>}
            </>
          ) : (
            post.package && <span>Package: {post.package}</span>
          )}
        </div>
        <Link
          href={`/student/placement/posts/${post.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </Link>
      </div>
    </Card>
  );
}

