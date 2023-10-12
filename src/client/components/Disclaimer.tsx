import { Button } from "@mui/material";
import { Stack } from "@mui/system";
import { dictionary } from "../text-constants";
import { useToHome } from "../hooks/user-hooks";

export function Disclaimer() {
  const goHome = useToHome();

  return (
    <Stack
      sx={{
        display: "flex",
        height: {
          xs: "100%",
          md: "auto",
        },
        width: {
          xs: "100%",
          md: "calc(100% - 80px)",
        },
        padding: {
          xs: "10px",
          md: "40px"
        },
        margin: {
          xs: 0,
          md: "40px"
        },
        backgroundColor: "#fff",
        borderRadius: {
          xs: 0,
          md: "30px",
        }
      }}
      data-testId={"disclaimerRoot"}
    >
      <Stack
        sx={{
          fontSize: 16,
          marginBottom: "25px",
        }}
      >
        {dictionary.disclaimer.start}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {dictionary.disclaimer.progress}
      </Stack>

      <Stack
        sx={{
          fontSize: 16,
          marginBottom: {
            xs: "15px",
            md: "150px",
          }
        }}
      >
        {dictionary.disclaimer.progressDescription}
      </Stack>

      <Button
        sx={{
          width: {
            xs: "100%",
            sm: "350px",
          },
          height: "60px",
          fontSize: "26px",
          alignSelf: "center",
          textTransform: "none",
        }}
        variant="contained"
        color="primary"
        onClick={() => {
          goHome();
        }}
      >
        {dictionary.disclaimer.continue}
      </Button>
    </Stack>
  );
}
