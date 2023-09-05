import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { alpha, styled } from '@mui/material/styles'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    marginTop: 24,
    // margin: theme.spacing(0.5, 1),
    // border: 0,
    // '&.Mui-disabled': {
    //     border: 0,
    // },
    '&.MuiToggleButton-root': {
      paddingTop: 1,
      paddingBottom: 1,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      whiteSpace: 'nowrap',
      [theme.breakpoints.down('sm')]: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      },
    },
    '&.MuiToggleButton-root.Mui-selected': {
      color: theme.palette.primary.main,
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&:not(:first-of-type)': {
      borderRadius: 0, //theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: 0, //theme.shape.borderRadius,
    },
  },
}))
{
  /* <ToggleButton value="all" aria-label="all">
전체
</ToggleButton>
<ToggleButton value="robot" aria-label="robot">
로봇형
</ToggleButton>
<ToggleButton value="module" aria-label="module">
모듈형
</ToggleButton>
<ToggleButton value="board" aria-label="board"> */
}

export default StyledToggleButtonGroup
