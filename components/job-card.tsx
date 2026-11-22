import Link from "next/link";
import type { JobWithBrand } from "@/lib/jobs/types";
import { EMPLOYMENT_LABEL, deadlineText, placeText, postedText, salaryText } from "@/lib/jobs/format";
import { BrandMark } from "./site";

export function JobCard({ job, distanceKm, today }: { job: JobWithBrand; distanceKm?: number; today: string }) {
  const dl = deadlineText(job.deadline, today);
  const urgent = dl.startsWith("Còn") || dl.startsWith("Hạn chót");
  return (
    <li className="jc">
      <Link href={`/jobs/${job.id}`} className="jc-link">
        <BrandMark brand={job.brand} size={52} />
        <div className="jc-body">
          <h3 className="jc-title">{job.title}</h3>
          <p className="jc-brand">{job.brand.name}</p>
          <p className="jc-salary">{salaryText(job)}</p>
          <p className="jc-meta">
            <span>{EMPLOYMENT_LABEL[job.employmentType]}</span>
            <span>
              {placeText(job.locations)}
              {distanceKm !== undefined && ` · cách ${distanceKm < 1 ? "<1" : distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`}
            </span>
          </p>
          <p className="jc-foot">
            <span>{postedText(job.postedAt, today)}</span>
            <span className={urgent ? "jc-urgent" : undefined}>{dl}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
