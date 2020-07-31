/**
 * @author psarando, sriram
 *
 * Input Selector form field for picking a path from the data store.
 */
import React from "react";

import { injectIntl } from "react-intl";

import DataSelectionDrawer from "../../data/SelectionDrawer";
import { UploadTrackingProvider } from "../../../contexts/uploadTracking";

import ids from "./ids";
import messages from "./messages";
import styles from "./styles";

import {
    build as buildDebugId,
    getMessage,
    formatMessage,
    withI18N,
    FormTextField,
} from "@cyverse-de/ui-lib";

import {
    Button,
    Grid,
    IconButton,
    InputAdornment,
    makeStyles,
} from "@material-ui/core";

import ClearIcon from "@material-ui/icons/Clear";

const useStyles = makeStyles(styles);

/**
 * A Browse button used by Input Selectors to open the data `SelectionDrawer`.
 */
const BrowseButton = (props) => {
    const {
        baseId,
        startingPath,
        acceptedType,
        multiSelect,
        onConfirm,
    } = props;

    const [open, setOpen] = React.useState(false);

    return (
        <>
            <Button
                color="primary"
                size="small"
                variant="outlined"
                onClick={() => setOpen(true)}
            >
                {getMessage("browse")}
            </Button>
            <UploadTrackingProvider>
                <DataSelectionDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    startingPath={startingPath}
                    acceptedType={acceptedType}
                    onConfirm={(selections) => {
                        setOpen(false);
                        onConfirm(selections);
                    }}
                    baseId={buildDebugId(baseId, "dataSelection")}
                    multiSelect={multiSelect}
                />
            </UploadTrackingProvider>
        </>
    );
};

/**
 * An Input Selector form field for picking data store file or folder paths.
 */
const InputSelector = ({ intl, acceptedType, startingPath, ...props }) => {
    // These props need to be spread down into the FormTextField
    const { id, field, form, required } = props;
    const classes = useStyles();

    const { setFieldValue } = form;

    const inputProps = {
        readOnly: true,
        endAdornment:
            <InputAdornment position="end">
                <BrowseButton
                    baseId={id}
                    startingPath={startingPath}
                    acceptedType={acceptedType}
                    multiSelect={false}
                    name={field.name}
                    onConfirm={(selections) => {
                        setFieldValue(field.name, selections);
                    }}
                />
            </InputAdornment>
    };

    if (field.value && !required) {
        inputProps.endAdornment = (
            <IconButton
                id={buildDebugId(field.name, ids.BUTTONS.DELETE)}
                aria-label={formatMessage(intl, "clearInput")}
                size="small"
                onClick={() => setFieldValue(field.name, "")}
            >
                <ClearIcon />
            </IconButton>
        );
    }

    return (
        <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="center"
        >
            <Grid item xs>
                <FormTextField
                    InputProps={inputProps}
                    size="small"
                    className={classes.inputSelectorTextFiled}
                    {...props}
                />
            </Grid>
        </Grid>
    );
};

export { BrowseButton };

export default injectIntl(withI18N(InputSelector, messages));
