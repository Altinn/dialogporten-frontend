import type { AutocompleteItemProps, AutocompleteProps, QueryItemType } from '@altinn/altinn-components';
import type { CountableDialogFieldsFragment, OrganizationFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { Link, type LinkProps } from 'react-router-dom';
import { getOrganization, getOrganizationByLocale } from '../../../api/utils/organizations.ts';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';

export const createSendersForAutocomplete = (
  searchValue: string,
  dialogs: CountableDialogFieldsFragment[],
  organizations?: OrganizationFieldsFragment[],
): AutocompleteProps => {
  const TYPE_SUGGEST = 'suggest';

  if (!searchValue) {
    return {
      items: [],
      groups: {
        noHits: { title: 'noHits' },
      },
    };
  }

  const searchTerms = searchValue.split(/\s+/).filter(Boolean);
  const availableOrgs = dialogs.map((dialog) => dialog.org);

  const availableOrgsMatchPattern = availableOrgs.map((org) => {
    const translatedOrgNames = ['nb', 'nn', 'en']
      .map((lang) => {
        const orgName = getOrganizationByLocale(organizations || [], org, lang)?.name;
        return orgName ? orgName.toLowerCase() : '';
      })
      .filter((a) => !!a);
    return {
      org,
      content: translatedOrgNames,
    };
  });

  const registeredCombinations: Set<string> = new Set();

  const items = searchTerms.map((searchTerm) => {
    const searchTermLower = searchTerm.toLowerCase();

    const matchedOrg = availableOrgsMatchPattern.find((availableOrg) => {
      return (
        (searchTermLower.length >= 3 && availableOrg.org.toLowerCase() === searchTermLower) ||
        availableOrg.content.some((name) => name.includes(searchTermLower))
      );
    });

    if (matchedOrg && searchTermLower.length >= 3) {
      const serviceOwner = getOrganization(organizations || [], matchedOrg.org);
      const searchCopy = [...searchTerms];
      const matchIndex = searchCopy.findIndex((term) => term.toLowerCase() === searchTermLower);
      if (matchIndex !== -1) {
        searchCopy.splice(matchIndex, 1);
      }
      const searchQuery = searchCopy.join(' ');

      const combinationKey = `${matchedOrg.org}|${searchQuery}`;
      if (registeredCombinations.has(combinationKey)) {
        return null;
      }
      registeredCombinations.add(combinationKey);

      const senderName = serviceOwner?.name || matchedOrg.org;
      const linkTitleMessageId =
        searchQuery.trim().length > 0
          ? 'search.autocomplete.searchForSender.withQuery'
          : 'search.autocomplete.searchForSender.withoutQuery';

      const linkTitle = t(linkTitleMessageId, {
        sender: senderName,
        query: searchQuery,
      });

      return {
        id: linkTitle,
        groupId: 'all-scopes-2',
        title: linkTitle,
        params: [
          { type: 'filter', label: senderName },
          ...(searchQuery ? [{ type: 'search' as QueryItemType, label: searchQuery }] : []),
        ],
        type: TYPE_SUGGEST,
        as: (props: AutocompleteItemProps) => (
          <Link
            key={linkTitle}
            {...(props as LinkProps)}
            to={`/${pruneSearchQueryParams(location.search, { org: matchedOrg.org, search: searchQuery })}`}
            aria-label={linkTitle}
          />
        ),
        interactive: true,
      };
    }
    return null;
  });

  const mappedSenderWithKeywords = items.filter(Boolean).map((item) => {
    const filteredSearchValues = searchTerms.filter(
      (searchString) =>
        !item?.title!.toLowerCase().includes(searchString.toLowerCase()) &&
        !item?.id!.toLowerCase().includes(searchString.toLowerCase()) &&
        !availableOrgs.includes(searchString),
    );

    return {
      ...item,
      params: [
        //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
        ...item.params,
        ...filteredSearchValues.map((searchString) => ({
          type: 'search',
          label: searchString,
        })),
      ],
    };
  });

  return {
    items: mappedSenderWithKeywords as AutocompleteItemProps[],
    groups: {},
  };
};
