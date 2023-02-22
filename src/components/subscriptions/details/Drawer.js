import React, { useState } from "react";
import { useQuery } from "react-query";
import { useTranslation } from "i18n";

import {
    Box,
    Divider,
    Drawer,
    Grid,
    IconButton,
    makeStyles,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@material-ui/core";

import { VerifiedUser } from "@material-ui/icons";

import { formatDateObject } from "components/utils/DateFormatter";
import GridLabelValue from "components/utils/GridLabelValue";
import buildID from "components/utils/DebugIDUtil";
import ids from "../ids";
import GridLoading from "components/utils/GridLoading";
import ErrorTypographyWithDialog from "components/error/ErrorTypographyWithDialog";
import { DETab, DETabPanel, DETabs } from "../../utils/DETabs";
import dateConstants from "components/utils/dateConstants";
import constants from "../../../../src/constants";
import navigationConstants from "../../../common/NavigationConstants";
import { formatFileSize } from "components/data/utils";

import {
    getSubscriptions,
    SUBSCRIPTIONS_QUERY_KEY,
} from "serviceFacades/subscriptions";

const TABS = {
    subscriptionDetails: "Details",
};

const useStyles = makeStyles((theme) => ({
    drawerPaper: {
        [theme.breakpoints.up("lg")]: {
            maxWidth: "25%",
        },
        [theme.breakpoints.down("lg")]: {
            maxWidth: "50%",
        },
        [theme.breakpoints.down("sm")]: {
            maxWidth: "90%",
        },
    },
    drawerHeader: {
        margin: theme.spacing(1),
        height: "2em",
        display: "flex",
        flexDirection: "row",
        maxWidth: "100%",
        alignItems: "center",
    },
    drawerSubheader: {
        margin: theme.spacing(1),
        display: "flex",
        flexDirection: "row",
        maxWidth: "100%",
    },
}));

function DetailsPanel(props) {
    const { baseId, selectedSubscription } = props;
    const { t } = useTranslation("subscriptions");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);

    const { isFetching: isInfoFetching, error: infoFetchError } = useQuery({
        queryKey: [SUBSCRIPTIONS_QUERY_KEY, { baseId: baseId }],
        queryFn: () =>
            getSubscriptions({
                searchTerm: selectedSubscription?.user.username,
            }),
        enabled: !!selectedSubscription,
        onSuccess: (data) => {
            setSubscriptionDetails(data.result.subscriptions[0]);
        },
    });

    if (isInfoFetching) {
        return <GridLoading rows={10} baseId={baseId} />;
    }

    if (infoFetchError) {
        return (
            <ErrorTypographyWithDialog
                errorObject={infoFetchError}
                errorMessage={t("subscriptionInfoError")}
            />
        );
    }

    return (
        <Box p={isMobile ? 1 : 3}>
            <Grid
                container
                spacing={3}
                id={buildID(baseId, subscriptionDetails?.id, ids.DETAILS_PANEL)}
            >
                <GridLabelValue label={t("startDate")}>
                    {formatDateObject(
                        subscriptionDetails?.effective_start_date &&
                            new Date(subscriptionDetails?.effective_start_date),
                        dateConstants.DATE_FORMAT
                    )}
                </GridLabelValue>
                <GridLabelValue label={t("endDate")}>
                    {formatDateObject(
                        subscriptionDetails?.effective_end_date &&
                            new Date(subscriptionDetails?.effective_end_date),
                        dateConstants.DATE_FORMAT
                    )}
                </GridLabelValue>
                <GridLabelValue label={t("planName")}>
                    {subscriptionDetails?.plan.name}
                </GridLabelValue>
                <GridLabelValue label={t("quotas")}>
                    <QuotasDetails selectedSubscription={subscriptionDetails} />
                </GridLabelValue>
                <GridLabelValue label={t("usages")}>
                    <UsagesDetails selectedSubscription={subscriptionDetails} />
                </GridLabelValue>
            </Grid>
        </Box>
    );
}

function QuotasDetails(props) {
    const { selectedSubscription } = props;
    return (
        <>
            {selectedSubscription &&
                selectedSubscription.quotas.length > 0 &&
                selectedSubscription.quotas.map((item, index) => {
                    // Only format data storage resources to human readable format
                    let resourceInBytes =
                        item.resource_type.unit.toLowerCase() === "bytes";
                    if (resourceInBytes) {
                        return (
                            <Typography key={index}>
                                {formatFileSize(item.quota)}
                            </Typography>
                        );
                    } else {
                        return (
                            <Typography key={index}>
                                {item.quota} {item.resource_type.unit}
                            </Typography>
                        );
                    }
                })}
        </>
    );
}

function SubscriptionDrawer(props) {
    const {
        anchor,
        baseId,
        data,
        onClose,
        open,
        selectedSubscription,
        selectedUserPortalId,
    } = props;
    const classes = useStyles();
    const drawerId = buildID(baseId, ids.DETAILS_DRAWER);
    const detailsTabId = buildID(drawerId, ids.DETAILS_TAB);
    const { t } = useTranslation("subscriptions");
    const selectedTab = TABS.subscriptionDetails;

    const username = selectedSubscription?.user.username;

    return (
        <Drawer
            anchor={anchor}
            onClose={onClose}
            open={open}
            PaperProps={{
                id: drawerId,
                classes: { root: classes.drawerPaper },
                variant: "outlined",
            }}
        >
            <DETabs value={selectedTab}>
                <DETab
                    value={TABS.subscriptionDetails}
                    label={t("subscriptionDetailsTabLabel")}
                    id={detailsTabId}
                />
            </DETabs>
            <DETabPanel
                tabId={detailsTabId}
                value={TABS.subscriptionDetails}
                selectedTab={selectedTab}
            >
                <SubscriptionHeader
                    baseId={baseId}
                    username={username}
                    portalId={selectedUserPortalId}
                />
                <Divider />
                <SubscriptionSubheader />
                <DetailsPanel
                    baseId={baseId}
                    data={data}
                    selectedSubscription={selectedSubscription}
                />
            </DETabPanel>
        </Drawer>
    );
}

function SubscriptionHeader(props) {
    const { portalId, username } = props;
    const classes = useStyles();
    const baseURL = constants.DEFAULT_USER_PORTAL_URL;
    const subURL = navigationConstants.ADMIN_USER_PORTAL_USERS;
    const linkToUserPortal = `${baseURL}${subURL}/${portalId}`;
    return (
        <div className={classes.drawerHeader}>
            {portalId && (
                <Tooltip title={linkToUserPortal}>
                    <IconButton
                        href={linkToUserPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <VerifiedUser fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            )}

            <Typography variant="h6" component="span">
                {username}
            </Typography>
        </div>
    );
}

function SubscriptionSubheader() {
    const { t } = useTranslation("subscriptions");
    const classes = useStyles();

    return (
        <div className={classes.drawerSubheader}>
            <Grid container>
                <Grid xs={12}>
                    <item>{t("details")}</item>
                </Grid>
            </Grid>
        </div>
    );
}

function UsagesDetails(props) {
    const { selectedSubscription } = props;
    const { t } = useTranslation("subscriptions");

    return (
        <>
            {selectedSubscription &&
                selectedSubscription.usages.length > 0 &&
                selectedSubscription.usages.map((item, _) => {
                    return (
                        <Typography>
                            {item.usage} {item.resource_type.unit}
                        </Typography>
                    );
                })}

            {selectedSubscription && !selectedSubscription.usages.length && (
                <Typography>{t("noUsages")}</Typography>
            )}
        </>
    );
}

export default SubscriptionDrawer;