import { useTheme } from '@mui/material/styles';
import { Stack, StackProps, alpha } from '@mui/system';

export interface PaperBgProps extends StackProps {
  disableopacity?: boolean
}

export function Paper({ sx, ...props }: PaperBgProps) {
	const theme = useTheme();

	return (
		<Stack
			{...props}
			sx={[
				{
          display: 'flex',
					backgroundColor: alpha(theme.palette.background.paper, props.disableopacity ? 1 : theme.opacity.paper),
				},
				...(Array.isArray(sx) ? sx : [sx]),
			]}
		/>
	);
}