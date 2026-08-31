import React from "react";
import { ReportItem } from "../types";
import { Screen7_SiteComparison } from "./Screen7_SiteComparison";

interface Screen6Props {
  currentReport: ReportItem;
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
  onSelectSiteFilter?: (siteName: string) => void;
}

export const Screen6_SimilarityExplorer: React.FC<Screen6Props> = ({
  currentReport,
  reports,
  onSelectReport,
  onSelectSiteFilter = () => {}
}) => {
  return (
    <Screen7_SiteComparison
      reports={reports}
      currentReport={currentReport}
      onSelectReport={onSelectReport}
      onSelectSiteFilter={onSelectSiteFilter}
    />
  );
};
