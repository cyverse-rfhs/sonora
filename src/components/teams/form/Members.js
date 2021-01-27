/**
 * @author aramsey
 *
 * A component that allows a user to view/edit the members in a team
 */

import React, { useMemo } from "react";

import { build, FormSelectField } from "@cyverse-de/ui-lib";
import { Button, makeStyles, MenuItem, Typography } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { Field, getIn } from "formik";

import { useTranslation } from "i18n";
import ids from "../ids";
import styles from "../styles";
import SubjectSearchField from "components/sharing/SubjectSearchField";
import { useUserProfile } from "contexts/userProfile";
import { MemberPrivileges } from "components/models/Privilege";
import SimpleExpansionPanel from "components/tools/SimpleExpansionPanel";
import { getUserPrimaryText } from "components/sharing/util";
import BasicTable from "components/utils/BasicTable";
import { DEFAULT_MEMBER_PRIVILEGE } from "../util";
import { SubjectTableCell } from "../../sharing/UserTable";

const useStyles = makeStyles(styles);

/**
 * A Formik selector for choosing privileges for members within a team
 * @param props
 */
function MemberPrivilegeSelector(props) {
    const { parentId, field, onChange, ...rest } = props;
    const { t } = useTranslation("teams");
    const selectId = build(parentId, ids.EDIT_TEAM.PRIVILEGE);

    return (
        <FormSelectField
            {...rest}
            fullWidth={false}
            field={field}
            id={selectId}
            onChange={onChange}
        >
            {MemberPrivileges.map((privilegeType) => (
                <MenuItem
                    value={privilegeType.value}
                    id={build(
                        selectId,
                        ids.EDIT_TEAM[privilegeType.value.toUpperCase()]
                    )}
                    key={build(
                        selectId,
                        ids.EDIT_TEAM[privilegeType.value.toUpperCase()]
                    )}
                >
                    {t(privilegeType.value)}
                </MenuItem>
            ))}
        </FormSelectField>
    );
}

function Members(props) {
    const {
        parentId,
        isAdmin,
        push,
        remove,
        form: { values },
        name,
    } = props;
    const classes = useStyles();
    const { t } = useTranslation(["teams", "sharing"]);

    const [userProfile] = useUserProfile();
    const username = userProfile?.id;

    const privileges = getIn(values, name);

    const memberExists = (subject) => {
        const exists = privileges.filter(
            (privilege) => privilege.subject.id === subject.id
        );
        return exists?.length > 0;
    };

    const addMember = (subject) => {
        if (!memberExists(subject)) {
            const defaultPrivilege = {
                name: DEFAULT_MEMBER_PRIVILEGE,
                subject: { ...subject },
            };
            push(defaultPrivilege);
        }
    };

    const baseId = build(parentId, ids.EDIT_TEAM.MEMBERS);

    const columns = useMemo(() => {
        const isSelf = (privilege) => {
            return privilege.subject.id === username;
        };

        const getRowId = (row) => {
            return build(baseId, row.original.subject.id);
        };

        return [
            {
                Header: t("sharing:user"),
                accessor: (row) => getUserPrimaryText(row.subject),
                Cell: ({ row }) => {
                    return (
                        <Field
                            name={`${name}.${row.index}.subject`}
                            render={({ field: { value } }) => {
                                return <SubjectTableCell subject={value} />;
                            }}
                        />
                    );
                },
            },
            {
                Header: t("privilege"),
                accessor: "name",
                Cell: ({ row }) => {
                    const privilege = row.original;
                    const rowId = getRowId(row);
                    return (
                        <Field
                            name={`${name}.${row.index}.name`}
                            render={({
                                field: { onChange, ...field },
                                ...props
                            }) => {
                                if (!isAdmin || isSelf(privilege)) {
                                    return t(privilege.name);
                                }
                                return (
                                    <MemberPrivilegeSelector
                                        {...props}
                                        parentId={rowId}
                                        onChange={onChange}
                                        field={field}
                                    />
                                );
                            }}
                        />
                    );
                },
            },
            {
                Header: "",
                accessor: "subject.id",
                Cell: ({ row }) => {
                    const privilege = row.original;
                    const rowId = getRowId(row);
                    if (isAdmin && !isSelf(privilege)) {
                        return (
                            <Button
                                id={build(rowId, ids.BUTTONS.DELETE)}
                                aria-label={t("remove")}
                                className={classes.deleteBtn}
                                onClick={() => {
                                    remove(row.index);
                                }}
                            >
                                <Delete />
                            </Button>
                        );
                    }
                    return null;
                },
            },
        ];
    }, [baseId, classes.deleteBtn, isAdmin, name, remove, t, username]);

    return (
        <SimpleExpansionPanel
            header={t("members")}
            defaultExpanded={true}
            parentId={baseId}
        >
            <Typography variant="body2">{t("memberHelpMessage")}</Typography>
            {isAdmin && (
                <SubjectSearchField
                    parentId={baseId}
                    onUserSelected={addMember}
                />
            )}
            <BasicTable columns={columns} data={privileges} sortable />
        </SimpleExpansionPanel>
    );
}

export default Members;
