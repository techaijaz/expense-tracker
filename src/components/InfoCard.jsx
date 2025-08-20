/* eslint-disable react/prop-types */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const InfoCard = ({
  icon,
  title,
  description,
  amount,
  iconBgColor = 'bg-green-100',
  iconTextColor = 'text-green-600',
}) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full sm:w-[48%] md:w-[32%] bg-white dark:bg-gray-800">
      <div className="flex items-center p-4 space-x-4">
        {/* Icon Section */}
        <div
          className={`p-3 rounded-full flex items-center justify-center ${iconBgColor} ${iconTextColor}`}
        >
          {icon}
        </div>

        {/* Text Section */}
        <div className="flex-1">
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </CardTitle>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">
              {amount}
            </p>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </CardDescription>
          </CardHeader>
        </div>
      </div>
    </Card>
  );
};

export default InfoCard;
