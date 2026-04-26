import React from "react";
import Typography from "@material-ui/core/Typography";

export default function Title(props) {
	return (
		<Typography variant="h4" sx={{ fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }} {...props}>
			{props.children}
		</Typography>
	);
}
