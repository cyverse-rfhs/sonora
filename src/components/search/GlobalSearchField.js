/**
 *
 * @author Sriram
 * A global search field with options to filter on apps, analyses and data
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "i18n";
import { queryCache } from "react-query";
import Link from "next/link";
import { useRouter } from "next/router";

import {
    useDataSearch,
    useAppsSearch,
    useAnalysesSearch,
} from "./searchQueries";
import ResourceTypes from "../models/ResourceTypes";
import searchConstants from "./constants";
import constants from "../../constants";
import withErrorAnnouncer from "components/utils/error/withErrorAnnouncer";
import NavigationConstants from "common/NavigationConstants";
import { getParentPath } from "components/data/utils";

import { BOOTSTRAP_KEY } from "serviceFacades/users";
import { ANALYSES_SEARCH_QUERY_KEY } from "serviceFacades/analyses";
import { APPS_SEARCH_QUERY_KEY } from "serviceFacades/apps";
import { DATA_SEARCH_QUERY_KEY } from "serviceFacades/filesystem";

import appFields from "components/apps/appFields";
import analysisFields from "components/analyses/analysisFields";

import ids from "./ids";
import { getDataSimpleSearchQuery } from "./dataSearchQueryBuilder";
import { getAnalysesSearchQueryFilter } from "./analysesSearchQueryBuilder";

import { build, Highlighter } from "@cyverse-de/ui-lib";

import SearchIcon from "@material-ui/icons/Search";
import {
    CircularProgress,
    ListItem,
    MenuItem,
    TextField,
    ListItemText,
    ListItemIcon,
    useMediaQuery,
    useTheme,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import DescriptionIcon from "@material-ui/icons/Description";
import FolderIcon from "@material-ui/icons/Folder";

const useStyles = makeStyles((theme) => ({
    root: {
        position: "relative",
        marginRight: 0,
        marginLeft: 0,
        [theme.breakpoints.up("sm")]: {
            marginLeft: theme.spacing(2),
            width: "60%",
        },
        [theme.breakpoints.down("xs")]: {
            margin: theme.spacing(1),
            width: "95%",
        },
    },
    paper: {
        boxShadow: "none",
        margin: 0,
    },
    option: {
        minHeight: "auto",
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    searchFilter: {
        marginRight: theme.spacing(4),
        height: theme.spacing(3.6),
        borderRadius: 0,
        width: 100,
        color: theme.palette.info.main,
        [theme.breakpoints.down("xs")]: {
            margin: theme.spacing(1),
            borderRadius: theme.spacing(1),
            width: "90%",
        },
        [theme.breakpoints.up("sm")]: {
            backgroundColor: theme.palette.info.contrastText,
        },
    },
    input: {
        position: "relative",
        height: theme.spacing(3.6),
        borderRadius: 0,
        color: theme.palette.info.main,
        [theme.breakpoints.down("xs")]: {
            border: theme.spacing(0.5),
            borderRadius: theme.spacing(1),
        },
        [theme.breakpoints.up("sm")]: {
            backgroundColor: theme.palette.info.contrastText,
        },
    },
    icon: {
        marginTop: theme.spacing(2),
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
    },
}));

const SearchOption = React.forwardRef((props, ref) => {
    const { primary, secondary, icon, searchTerm, onClick, href } = props;
    const classes = useStyles();
    return (
        <ListItem
            alignItems="flex-start"
            dense={true}
            divider={true}
            href={href}
            onClick={onClick}
            ref={ref}
        >
            <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
            <ListItemText
                primary={
                    <Highlighter search={searchTerm}>{primary}</Highlighter>
                }
                primaryTypographyProps={{
                    variant: "body1",
                    color: "primary",
                }}
                secondary={
                    <Highlighter search={searchTerm}>{secondary}</Highlighter>
                }
                secondaryTypographyProps={{
                    variant: "caption",
                    wrap: "true",
                }}
            />
        </ListItem>
    );
});

function DataSearchOption(props) {
    const { selectedOption, searchTerm } = props;

    const type = selectedOption._type;
    let icon = <FolderIcon />;
    let path = selectedOption._source.path;

    //SS route to parent folder for the file util we have file viewers ready in sonora.
    if (type === ResourceTypes.FILE) {
        path = getParentPath(path);
        icon = <DescriptionIcon />;
    }

    const href = `/${NavigationConstants.DATA}/${constants.DATA_STORE_STORAGE_ID}`;
    const as = `/${NavigationConstants.DATA}/${constants.DATA_STORE_STORAGE_ID}${path}`;
    return (
        <Link href={href} as={as} passHref>
            <SearchOption
                primary={selectedOption.name}
                secondary={selectedOption._source?.path}
                icon={icon}
                searchTerm={searchTerm}
            />
        </Link>
    );
}

function AppsSearchOption(props) {
    const { t } = useTranslation("common");
    const { selectedOption, searchTerm } = props;
    const href = `/${NavigationConstants.APPS}/[systemId]/[appId]`;
    const as = `/${NavigationConstants.APPS}/${selectedOption?.system_id}/${selectedOption?.id}`;
    return (
        <Link href={href} as={as} passHref>
            <SearchOption
                primary={selectedOption.name}
                secondary={selectedOption.description}
                icon={<img src="/icon-apps.png" alt={t("apps")} />}
                searchTerm={searchTerm}
            />
        </Link>
    );
}

function AnalysesSearchOption(props) {
    const { t } = useTranslation("common");
    const { selectedOption, searchTerm } = props;
    const href = `/${NavigationConstants.ANALYSES}/[analysisId]`;
    const as = `/${NavigationConstants.ANALYSES}/${selectedOption?.id}`;
    return (
        <Link href={href} as={as} passHref>
            <SearchOption
                primary={selectedOption.name}
                secondary={selectedOption.status}
                icon={<img src="/icon-analyses.png" alt={t("analyses")} />}
                searchTerm={searchTerm}
            />
        </Link>
    );
}

function GlobalSearchField(props) {
    const classes = useStyles();
    const router = useRouter();
    const { search, showErrorAnnouncer } = props;

    const { t } = useTranslation(["common", "analyses"]);

    const appRecordFields = appFields();

    const [searchTerm, setSearchTerm] = useState(search);
    const [filter, setFilter] = useState(searchConstants.ALL);

    const [options, setOptions] = useState([]);
    const [open, setOpen] = useState(false);

    const [analysesSearchKey, setAnalysesSearchKey] = useState(
        ANALYSES_SEARCH_QUERY_KEY
    );
    const [appsSearchKey, setAppsSearchKey] = useState(APPS_SEARCH_QUERY_KEY);
    const [dataSearchKey, setDataSearchKey] = useState(DATA_SEARCH_QUERY_KEY);

    const [
        analysesSearchQueryEnabled,
        setAnalysesSearchQueryEnabled,
    ] = useState(false);
    const [appsSearchQueryEnabled, setAppsSearchQueryEnabled] = useState(false);
    const [dataSearchQueryEnabled, setDataSearchQueryEnabled] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("xs"));

    //get bootstrap from cache.
    const bootstrapCache = queryCache.getQueryData(BOOTSTRAP_KEY);
    let userHomeDir = bootstrapCache?.data_info.user_home_path;
    if (userHomeDir) {
        userHomeDir = userHomeDir + "/";
    }

    const {
        isFetching: searchingAnalyses,
        error: analysesSearchError,
    } = useAnalysesSearch(
        analysesSearchKey,
        analysesSearchQueryEnabled,
        (results) => {
            if (results && results.analyses?.length > 0) {
                const analyses = results.analyses;
                analyses.forEach((analysis) => {
                    analysis.resultType = t("analyses");
                });
                setOptions([...options, ...analyses]);
            }
        }
    );

    const { isFetching: searchingApps, error: appsSearchError } = useAppsSearch(
        appsSearchKey,
        appsSearchQueryEnabled,
        (results) => {
            if (results && results.apps?.length > 0) {
                const apps = results.apps;
                apps.forEach((app) => {
                    app.resultType = t("apps");
                });
                setOptions([...options, ...apps]);
            }
        }
    );

    const { isFetching: searchingData, error: dataSearchError } = useDataSearch(
        dataSearchKey,
        dataSearchQueryEnabled,
        (results) => {
            if (results && results.hits?.length > 0) {
                const data = results.hits;
                data.forEach((data) => {
                    data.name = data._source?.label;
                    data.resultType = t("data");
                });
                setOptions([...options, ...data]);
            }
        }
    );

    const handleChange = (event, value, reason) => {
        if (reason === "clear" || value === "") {
            setAnalysesSearchQueryEnabled(false);
            setAppsSearchQueryEnabled(false);
            setDataSearchQueryEnabled(false);
            setOptions([]);
        }
        setSearchTerm(value);
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    useEffect(() => {
        if (searchTerm && searchTerm.length > 2) {
            const dataQuery = getDataSimpleSearchQuery(
                searchTerm,
                userHomeDir,
                searchConstants.GLOBAL_SEARCH_PAGE_SIZE,
                searchConstants.GLOBAL_SEARCH_PAGE,
                "label",
                "ascending"
            );
            setDataSearchKey([DATA_SEARCH_QUERY_KEY, { query: dataQuery }]);

            setAppsSearchKey([
                APPS_SEARCH_QUERY_KEY,
                {
                    rowsPerPage: searchConstants.GLOBAL_SEARCH_PAGE_SIZE,
                    orderBy: appRecordFields.NAME.key,
                    order: constants.SORT_ASCENDING,
                    page: searchConstants.GLOBAL_SEARCH_PAGE,
                    search: searchTerm,
                },
            ]);

            const analysisRecordFields = analysisFields(t);
            setAnalysesSearchKey([
                ANALYSES_SEARCH_QUERY_KEY,
                {
                    rowsPerPage: searchConstants.GLOBAL_SEARCH_PAGE_SIZE,
                    orderBy: analysisRecordFields.START_DATE.key,
                    order: constants.SORT_DESCENDING,
                    page: searchConstants.GLOBAL_SEARCH_PAGE,
                    filter: getAnalysesSearchQueryFilter(searchTerm, t),
                },
            ]);
            switch (filter) {
                case searchConstants.DATA:
                    setDataSearchQueryEnabled(true);
                    setAppsSearchQueryEnabled(false);
                    setAnalysesSearchQueryEnabled(false);
                    break;

                case searchConstants.APPS:
                    setDataSearchQueryEnabled(false);
                    setAppsSearchQueryEnabled(true);
                    setAnalysesSearchQueryEnabled(false);
                    break;

                case searchConstants.ANALYSES:
                    setDataSearchQueryEnabled(false);
                    setAppsSearchQueryEnabled(false);
                    setAnalysesSearchQueryEnabled(true);
                    break;

                default:
                    setDataSearchQueryEnabled(true);
                    setAppsSearchQueryEnabled(true);
                    setAnalysesSearchQueryEnabled(true);
            }
        }
    }, [
        appRecordFields.NAME.key,
        bootstrapCache,
        filter,
        searchTerm,
        showErrorAnnouncer,
        t,
        userHomeDir,
    ]);

    useEffect(() => {
        if (analysesSearchError || appsSearchError || dataSearchError) {
            showErrorAnnouncer(
                t("searchError"),
                analysesSearchError || appsSearchError || dataSearchError
            );
        }
    }, [
        analysesSearchError,
        appsSearchError,
        dataSearchError,
        showErrorAnnouncer,
        t,
    ]);

    const loading = searchingAnalyses || searchingApps || searchingData;

    const renderCustomOption = (option) => {
        switch (option?.resultType) {
            case t("data"):
                return (
                    <DataSearchOption
                        selectedOption={option}
                        searchTerm={searchTerm}
                    />
                );
            case t("apps"):
                return (
                    <AppsSearchOption
                        selectedOption={option}
                        searchTerm={searchTerm}
                    />
                );
            case t("analyses"):
                return (
                    <AnalysesSearchOption
                        selectedOption={option}
                        searchTerm={searchTerm}
                    />
                );
            default:
                return null;
        }
    };

    const renderCustomInput = (params) => (
        <TextField
            {...params}
            className={classes.input}
            variant={isMobile ? "outlined" : "standard"}
            InputProps={{
                ...params.InputProps,
                disableUnderline: true,
                startAdornment: <SearchIcon color="primary" />,
                endAdornment: (
                    <React.Fragment>
                        {loading ? (
                            <CircularProgress color="primary" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                    </React.Fragment>
                ),
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    setOpen(false);
                    router.push(
                        `/${NavigationConstants.SEARCH}?searchTerm=${searchTerm}&filter=${filter}`
                    );
                }
            }}
        />
    );

    return (
        <>
            <Autocomplete
                classes={{
                    root: classes.root,
                    paper: classes.paper,
                    option: classes.option,
                }}
                open={open}
                debug={false}
                onOpen={() => {
                    setOpen(true);
                }}
                onClose={() => {
                    setOpen(false);
                }}
                id={ids.GLOBAL_SEARCH_FIELD}
                size="small"
                options={options}
                onInputChange={handleChange}
                getOptionLabel={(option) => option.name}
                getOptionSelected={(option, value) =>
                    option.name === value.name
                }
                filterOptions={(options, state) => options}
                loading={loading}
                loadingText={t("searching")}
                groupBy={(option) => option.resultType}
                renderOption={(option, state) => renderCustomOption(option)}
                renderInput={(params) => renderCustomInput(params)}
                popupIcon={null}
                noOptionsText={t("noOptions")}
                clearOnEscape={true}
                clearOnBlur={false}
            />
            <TextField
                id={build(ids.SEARCH, ids.SEARCH_FILTER_MENU)}
                select
                size="small"
                value={filter}
                onChange={handleFilterChange}
                className={classes.searchFilter}
                variant={isMobile ? "outlined" : "standard"}
                InputProps={{
                    disableUnderline: true,
                }}
            >
                <MenuItem value={searchConstants.ALL}>{t("all")}</MenuItem>
                <MenuItem value={searchConstants.DATA}>{t("data")}</MenuItem>
                <MenuItem value={searchConstants.APPS}>{t("apps")}</MenuItem>
                <MenuItem value={searchConstants.ANALYSES}>
                    {t("analyses")}
                </MenuItem>
            </TextField>
        </>
    );
}

export default withErrorAnnouncer(GlobalSearchField);
