import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Field, FieldArray, Form, Formik } from "formik";
import { mapPropsToValues } from "./formatters";
import DEDialog from "components/utils/DEDialog";
import { Button } from "@material-ui/core";
import FormTextField from "components/forms/FormTextField";

import {
    updateUserQuotas,
    getSubscriptions,
    SUBSCRIPTIONS_QUERY_KEY,
} from "serviceFacades/subscriptions";
import { announce } from "components/announcer/CyVerseAnnouncer";
import { useTranslation } from "react-i18next";

import ids from "../ids";
import { nonEmptyField } from "components/utils/validations";
import ErrorTypographyWithDialog from "components/error/ErrorTypographyWithDialog";
import buildID from "components/utils/DebugIDUtil";

import Usages from "./Usages";
import Quotas from "./Quotas";

function EditQuotasDialog(props) {
    const { open, onClose, parentId, subscription } = props;
    const [quotasSubmission, setQuotasSubmission] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [updateQuotasError, setUpdateQuotasError] = useState(null);
    const { t } = useTranslation("subscriptions");
    const queryClient = useQueryClient();
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    useQuery({
        queryKey: [
            SUBSCRIPTIONS_QUERY_KEY,
            { parentId: parentId, user: subscription?.user.username },
        ],
        queryFn: () =>
            getSubscriptions({ searchTerm: subscription?.user.username }),
        enabled: true,
        onSuccess: (data) => {
            setSelectedSubscription(data.result.subscriptions[0]);
        },
    });

    const { mutate: updateQuotas } = useMutation(
        () => updateUserQuotas(quotasSubmission, selectedUsername),
        {
            onSuccess: (data) => {
                announce({
                    text: t("quotaUpdated"),
                });
                setUpdateQuotasError(null);
                onClose();
                queryClient.invalidateQueries(SUBSCRIPTIONS_QUERY_KEY);
            },
            onError: setUpdateQuotasError,
        }
    );

    const handleSubmit = (values) => {
        const { quotas, username } = values;
        setSelectedUsername(username);
        setQuotasSubmission(quotas);
        updateQuotas();
    };

    const onCloseForm = () => {
        onClose();
        resetState();
    };

    const resetState = () => {
        setUpdateQuotasError(null);
        setQuotasSubmission(null);
    };

    return (
        <Formik
            initialValues={mapPropsToValues(selectedSubscription)}
            onSubmit={handleSubmit}
            enableReinitialize={true}
        >
            {({ handleSubmit, ...props }) => {
                return (
                    <Form>
                        <DEDialog
                            {...props}
                            id={parentId}
                            open={open}
                            onClose={() => {
                                onCloseForm();
                                props.resetForm();
                            }}
                            fullWidth={true}
                            title={t("editQuotas")}
                            actions={
                                <>
                                    <Button
                                        {...props}
                                        id={buildID(
                                            parentId,
                                            ids.CANCEL_BUTTON
                                        )}
                                        onClick={() => {
                                            onCloseForm();
                                            props.resetForm();
                                        }}
                                    >
                                        {t("cancel")}
                                    </Button>

                                    <Button
                                        id={buildID(parentId, ids.SAVE_BUTTON)}
                                        type="submit"
                                        color="primary"
                                        onClick={handleSubmit}
                                    >
                                        {t("submit")}
                                    </Button>
                                </>
                            }
                        >
                            {updateQuotasError && (
                                <ErrorTypographyWithDialog
                                    errorObject={updateQuotasError}
                                    errorMessage={t("updateQuotasError")}
                                    baseId={parentId}
                                />
                            )}

                            <EditQuotasForm
                                parentId={parentId}
                                subscription={selectedSubscription}
                            />
                        </DEDialog>
                    </Form>
                );
            }}
        </Formik>
    );
}

function EditQuotasForm(props) {
    const { parentId, subscription } = props;
    const { t } = useTranslation("subscriptions");
    const { t: i18nUtil } = useTranslation("util");
    return (
        <>
            <Field
                component={FormTextField}
                id={buildID(parentId, ids.EDIT_QUOTAS_DLG.USERNAME)}
                label={t("username")}
                name="username"
                disabled
                required
                validate={(value) => nonEmptyField(value, i18nUtil)}
            />

            <Field
                component={FormTextField}
                id={buildID(parentId, ids.EDIT_QUOTAS_DLG.PLAN_NAME)}
                label={t("planName")}
                name="plan_name"
                disabled
                required
                validate={(value) => nonEmptyField(value, i18nUtil)}
            />

            {subscription && (
                <FieldArray
                    name={"quotas"}
                    render={(arrayHelpers) => (
                        <Quotas
                            parentId={buildID(
                                parentId,
                                ids.EDIT_QUOTAS_DLG.QUOTAS
                            )}
                            subscription={subscription}
                            {...arrayHelpers}
                        />
                    )}
                />
            )}

            {subscription && (
                <FieldArray
                    name={"usages"}
                    render={(arrayHelpers) => (
                        <Usages
                            parentId={buildID(
                                parentId,
                                ids.EDIT_SUB_DLG.USAGES
                            )}
                            {...arrayHelpers}
                        />
                    )}
                />
            )}
        </>
    );
}

export default EditQuotasDialog;
