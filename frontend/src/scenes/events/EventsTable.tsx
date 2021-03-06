import React, { useMemo } from 'react'
import { useActions, useValues } from 'kea'
import { EventDetails } from 'scenes/events/EventDetails'
import { Link } from 'lib/components/Link'
import { Button } from 'antd'
import { FilterPropertyLink } from 'lib/components/FilterPropertyLink'
import { Property } from 'lib/components/Property'
import { autoCaptureEventToDescription } from 'lib/utils'
import './EventsTable.scss'
import { eventsTableLogic } from './eventsTableLogic'
import { PersonHeader } from 'scenes/persons/PersonHeader'
import { TZLabel } from 'lib/components/TimezoneAware'
import { keyMapping, PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import {
    ActionType,
    AnyPropertyFilter,
    ChartDisplayType,
    ColumnChoice,
    EventsTableRowItem,
    FilterType,
    InsightType,
} from '~/types'
import { LemonEventName } from 'scenes/actions/EventName'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { Tooltip } from 'lib/components/Tooltip'
import clsx from 'clsx'
import { tableConfigLogic } from 'lib/components/ResizableTable/tableConfigLogic'
import { urls } from 'scenes/urls'
import { LemonTable, LemonTableColumn } from 'lib/components/LemonTable'
import { TableCellRepresentation } from 'lib/components/LemonTable/types'
import { IconExport, IconSync } from 'lib/components/icons'
import { LemonButton } from 'lib/components/LemonButton'
import { More } from 'lib/components/LemonButton/More'
import { LemonSwitch } from 'lib/components/LemonSwitch/LemonSwitch'
import { teamLogic } from 'scenes/teamLogic'
import { createActionFromEvent } from './createActionFromEvent'
import { usePageVisibility } from 'lib/hooks/usePageVisibility'
import { LemonTableConfig } from 'lib/components/ResizableTable/TableConfig'

export interface FixedFilters {
    action_id?: ActionType['id']
    person_id?: string | number
    distinct_ids?: string[]
    properties?: AnyPropertyFilter[]
}

interface EventsTable {
    pageKey: string
    fixedFilters?: FixedFilters
    fixedColumns?: LemonTableColumn<EventsTableRowItem, keyof EventsTableRowItem | undefined>[]
    sceneUrl?: string
    fetchMonths?: number
    startingColumns?: ColumnChoice
    showCustomizeColumns?: boolean
    showExport?: boolean
    showAutoload?: boolean
    showEventFilter?: boolean
    showRowExpanders?: boolean
    showActionsButton?: boolean
    showPersonColumn?: boolean
    linkPropertiesToFilters?: boolean
}

export function EventsTable({
    pageKey,
    fixedFilters,
    fixedColumns,
    sceneUrl,
    // How many months of data to fetch?
    fetchMonths = 12,
    startingColumns,
    // disableLinkingPropertiesToFilters,

    showCustomizeColumns = true,
    showExport = true,
    showAutoload = true,
    showEventFilter = true,
    showRowExpanders = true,
    showActionsButton = true,
    showPersonColumn = true,
    linkPropertiesToFilters = true,
}: EventsTable): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const logic = eventsTableLogic({
        fixedFilters,
        key: pageKey,
        sceneUrl: sceneUrl || urls.events(),
        fetchMonths,
    })
    const {
        properties,
        eventsFormatted,
        isLoading,
        hasNext,
        isLoadingNext,
        eventFilter,
        automaticLoadEnabled,
        exportUrl,
        highlightEvents,
        months,
    } = useValues(logic)
    const { tableWidth, selectedColumns } = useValues(tableConfigLogic({ startingColumns }))

    const {
        fetchNextEvents,
        prependNewEvents,
        setEventFilter,
        toggleAutomaticLoad,
        startDownload,
        setPollingActive,
        setProperties,
    } = useActions(logic)

    const showLinkToPerson = !fixedFilters?.person_id

    usePageVisibility(setPollingActive)

    const newEventsRender = (
        { date_break, new_events }: EventsTableRowItem,
        colSpan: number
    ): TableCellRepresentation => {
        return {
            children:
                date_break ||
                (new_events ? (
                    <LemonButton
                        icon={<IconSync />}
                        style={{ borderRadius: 0 }}
                        onClick={() => prependNewEvents()}
                        center
                        fullWidth
                    >
                        There are new events. Click here to load them
                    </LemonButton>
                ) : (
                    '???'
                )),
            props: {
                colSpan: colSpan + 1,
                style: new_events ? { padding: 0 } : undefined,
            },
        }
    }
    const personColumn: LemonTableColumn<EventsTableRowItem, keyof EventsTableRowItem | undefined> = {
        title: 'Person',
        key: 'person',
        render: function renderPerson(_, { event }: EventsTableRowItem) {
            if (!event) {
                return { props: { colSpan: 0 } }
            }
            return showLinkToPerson && event.person?.distinct_ids?.length ? (
                <Link to={urls.person(event.person.distinct_ids[0])}>
                    <PersonHeader withIcon person={event.person} />
                </Link>
            ) : (
                <PersonHeader withIcon person={event.person} />
            )
        },
    }

    const defaultColumns = useMemo(() => {
        const _localColumns: LemonTableColumn<EventsTableRowItem, keyof EventsTableRowItem | undefined>[] = [
            {
                title: 'Event',
                key: 'event',
                width: '16rem',
                render: function render(_, item: EventsTableRowItem) {
                    if (!item.event) {
                        return newEventsRender(item, tableWidth)
                    }
                    const { event } = item
                    return <PropertyKeyInfo value={autoCaptureEventToDescription(event)} />
                },
            },
            {
                title: 'URL / Screen',
                key: 'url',
                width: '4rem',
                render: function renderURL(_, { event }: EventsTableRowItem) {
                    if (!event) {
                        return { props: { colSpan: 0 } }
                    }
                    const param = event.properties['$current_url'] ? '$current_url' : '$screen_name'
                    if (linkPropertiesToFilters) {
                        return (
                            <FilterPropertyLink
                                className="ph-no-capture"
                                property={param}
                                value={event.properties[param] as string}
                                filters={{ properties }}
                            />
                        )
                    }
                    return <Property value={event.properties[param]} />
                },
            },
            {
                title: 'Source',
                key: 'source',
                render: function renderSource(_, { event }: EventsTableRowItem) {
                    if (!event) {
                        return { props: { colSpan: 0 } }
                    }
                    if (linkPropertiesToFilters) {
                        return (
                            <FilterPropertyLink
                                property="$lib"
                                value={event.properties['$lib'] as string}
                                filters={{ properties }}
                            />
                        )
                    }
                    return <Property value={event.properties['$lib']} />
                },
            },
        ]
        if (showPersonColumn) {
            _localColumns.splice(1, 0, personColumn)
        }
        return _localColumns
    }, [tableWidth])

    const columns = useMemo(() => {
        const columnsSoFar =
            selectedColumns === 'DEFAULT'
                ? [...defaultColumns]
                : selectedColumns.map(
                      (e, index): LemonTableColumn<EventsTableRowItem, keyof EventsTableRowItem | undefined> =>
                          defaultColumns.find((d) => d.key === e) || {
                              title: keyMapping['event'][e] ? keyMapping['event'][e].label : e,
                              key: e,
                              render: function render(_, item: EventsTableRowItem) {
                                  const { event } = item
                                  if (!event) {
                                      if (index === 0) {
                                          return newEventsRender(item, tableWidth)
                                      } else {
                                          return { props: { colSpan: 0 } }
                                      }
                                  }
                                  if (linkPropertiesToFilters) {
                                      return (
                                          <FilterPropertyLink
                                              className="ph-no-capture "
                                              property={e}
                                              value={event.properties[e] as string}
                                              filters={{ properties }}
                                          />
                                      )
                                  }
                                  return <Property value={event.properties[e]} />
                              },
                          }
                  )
        columnsSoFar.push({
            title: 'Time',
            key: 'time',
            render: function renderTime(_, { event }: EventsTableRowItem) {
                if (!event) {
                    return { props: { colSpan: 0 } }
                }
                return <TZLabel time={event.timestamp} showSeconds />
            },
        })
        if (showActionsButton) {
            columnsSoFar.push({
                key: 'actions',
                width: 0,
                render: function renderActions(_, { event }: EventsTableRowItem) {
                    if (!event) {
                        return { props: { colSpan: 0 } }
                    }

                    let insightParams: Partial<FilterType> | undefined
                    if (event.event === '$pageview') {
                        insightParams = {
                            insight: InsightType.TRENDS,
                            interval: 'day',
                            display: ChartDisplayType.ActionsLineGraph,
                            actions: [],
                            events: [
                                {
                                    id: '$pageview',
                                    name: '$pageview',
                                    type: 'events',
                                    order: 0,
                                    properties: [
                                        {
                                            key: '$current_url',
                                            value: event.properties.$current_url,
                                            type: 'event',
                                        },
                                    ],
                                },
                            ],
                        }
                    } else if (event.event !== '$autocapture') {
                        insightParams = {
                            insight: InsightType.TRENDS,
                            interval: 'day',
                            display: ChartDisplayType.ActionsLineGraph,
                            actions: [],
                            events: [
                                {
                                    id: event.event,
                                    name: event.event,
                                    type: 'events',
                                    order: 0,
                                    properties: [],
                                },
                            ],
                        }
                    }

                    return (
                        <More
                            overlay={
                                <>
                                    {currentTeam && (
                                        <LemonButton
                                            type="stealth"
                                            onClick={() =>
                                                createActionFromEvent(
                                                    currentTeam.id,
                                                    event,
                                                    0,
                                                    currentTeam.data_attributes || []
                                                )
                                            }
                                            fullWidth
                                            data-attr="events-table-create-action"
                                        >
                                            Create action from event
                                        </LemonButton>
                                    )}
                                    {insightParams && (
                                        <LemonButton
                                            type="stealth"
                                            to={urls.insightNew(insightParams)}
                                            fullWidth
                                            data-attr="events-table-usage"
                                        >
                                            Try out in Insights
                                        </LemonButton>
                                    )}
                                </>
                            }
                        />
                    )
                },
            })
        }
        return fixedColumns ? columnsSoFar.concat(fixedColumns) : columnsSoFar
    }, [selectedColumns])

    return (
        <div data-attr="manage-events-table">
            <div
                className="events"
                data-attr="events-table"
                style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                }}
            >
                <div
                    className="mb"
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <PropertyFilters
                            propertyFilters={properties}
                            onChange={setProperties}
                            pageKey={pageKey}
                            taxonomicPopoverPlacement="bottom-start"
                            style={{ marginBottom: 0, marginTop: 0 }}
                            eventNames={eventFilter ? [eventFilter] : []}
                            useLemonButton
                            prefixComponent={
                                showEventFilter ? (
                                    <LemonEventName
                                        value={eventFilter}
                                        onChange={(value: string) => {
                                            setEventFilter(value || '')
                                        }}
                                    />
                                ) : (
                                    <></>
                                )
                            }
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            borderTop:
                                showAutoload || showCustomizeColumns || showExport ? '1px solid var(--border)' : 0,
                            width: '100%',
                            paddingTop: showAutoload || showCustomizeColumns || showExport ? '1rem' : 0,
                        }}
                    >
                        {showAutoload && (
                            <LemonSwitch
                                type="primary"
                                id="autoload-switch"
                                label="Automatically load new events"
                                checked={automaticLoadEnabled}
                                onChange={toggleAutomaticLoad}
                            />
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'row' }}>
                            {showCustomizeColumns && (
                                <LemonTableConfig
                                    immutableColumns={['event', 'person']}
                                    defaultColumns={defaultColumns.map((e) => e.key || '')}
                                />
                            )}
                            {showExport && exportUrl && (
                                <Tooltip title="Export up to 10,000 latest events." placement="left">
                                    <LemonButton
                                        type="secondary"
                                        icon={<IconExport style={{ color: 'var(--primary)' }} />}
                                        onClick={startDownload}
                                    >
                                        Export
                                    </LemonButton>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>

                <LemonTable
                    dataSource={eventsFormatted}
                    loading={isLoading}
                    columns={columns}
                    key={selectedColumns === 'DEFAULT' ? 'default' : selectedColumns.join('-')}
                    className="ph-no-capture"
                    loadingSkeletonRows={20}
                    emptyState={
                        isLoading ? undefined : properties.some((filter) => Object.keys(filter).length) ||
                          eventFilter ? (
                            `No events matching filters found in the last ${months} months!`
                        ) : (
                            <>
                                This project doesn't have any events. If you haven't integrated PostHog yet,{' '}
                                <Link to="/project/settings">
                                    click here to instrument analytics with PostHog in your product
                                </Link>
                                .
                            </>
                        )
                    }
                    rowKey={(row) =>
                        row.event ? row.event.id + '-' + row.event.event : row.date_break?.toString() || ''
                    }
                    rowClassName={(row) => {
                        return clsx({
                            'event-row': row.event,
                            highlighted: row.event && highlightEvents[row.event.id],
                            'event-row-is-exception': row.event && row.event.event === '$exception',
                            'event-row-date-separator': row.date_break,
                            'event-row-new': row.new_events,
                        })
                    }}
                    expandable={
                        showRowExpanders
                            ? {
                                  expandedRowRender: function renderExpand({ event }) {
                                      return event && <EventDetails event={event} />
                                  },
                                  rowExpandable: ({ event, date_break, new_events }) =>
                                      date_break || new_events ? -1 : !!event,
                              }
                            : undefined
                    }
                />
                <Button
                    type="primary"
                    onClick={fetchNextEvents}
                    loading={isLoadingNext}
                    style={{
                        display: hasNext || isLoadingNext ? 'block' : 'none',
                        margin: '2rem auto 1rem',
                    }}
                >
                    Load more events
                </Button>
            </div>
        </div>
    )
}
