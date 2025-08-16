import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Application } from '@/hooks/useApplications';
import { Edit, Trash2, FileText, Building2, Calendar } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
}

const ApplicationCard = ({ application, onEdit, onDelete }: ApplicationCardProps) => {
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-status-applied text-status-applied-foreground';
      case 'INTERVIEW':
        return 'bg-status-interview text-status-interview-foreground';
      case 'OFFER':
        return 'bg-blue-500 text-white';
      case 'REJECTED':
        return 'bg-status-rejected text-status-rejected-foreground';
      case 'HIRED':
        return 'bg-status-hired text-status-hired-foreground';
      case 'SAVED':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 size={18} className="text-muted-foreground" />
              {application.company}
            </h3>
            <p className="text-muted-foreground">{application.position}</p>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {application.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} />
            <span>Applied: {formatDate(application.date_applied)}</span>
          </div>
          
          {application.resume_url && (
            <div className="flex items-center gap-2 text-sm">
              <FileText size={14} className="text-muted-foreground" />
              <a 
                href={application.resume_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Resume
              </a>
            </div>
          )}
          
          {application.notes && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {application.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(application)}
          className="flex-1"
        >
          <Edit size={14} className="mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(application.id)}
          className="text-destructive hover:text-destructive flex-1"
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;