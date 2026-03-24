import Badge from './Badge';
import { getStatusTone } from '../../utils/adminFormat';

export default function StatusBadge({ status, style = {} }) {
  const tone = getStatusTone(status);

  return (
    <Badge tone={tone.accent} background={tone.background} dot style={style}>
      {status}
    </Badge>
  );
}
