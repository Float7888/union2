import { Card, CardContent } from "@/components/ui/card";

export const MissionStatement = () => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Our Mission
        </h2>
        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
          Building a bigger and stronger labor movement has never been more important. One critical step is 
          identifying and recruiting diverse, experienced, committed people for positions as union organizers, 
          researchers, communications staff and other roles. We're leaving no stone unturned and using innovative 
          strategies to help unions recruit the most qualified candidates.
        </p>
      </CardContent>
    </Card>
  );
};