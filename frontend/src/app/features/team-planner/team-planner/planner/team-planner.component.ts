import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  CalendarOptions,
  DateSelectArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core';
import {
  BehaviorSubject,
  combineLatest,
  Subject,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
} from 'rxjs/operators';
import { StateService } from '@uirouter/angular';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { ConfigurationService } from 'core-app/core/config/configuration.service';
import { EventViewLookupService } from 'core-app/features/team-planner/team-planner/planner/event-view-lookup.service';
import { WorkPackageViewFiltersService } from 'core-app/features/work-packages/routing/wp-view-base/view-services/wp-view-filters.service';
import { IsolatedQuerySpace } from 'core-app/features/work-packages/directives/query-space/isolated-query-space';
import { CurrentProjectService } from 'core-app/core/current-project/current-project.service';
import { splitViewRoute } from 'core-app/features/work-packages/routing/split-view-routes.helper';
import { QueryFilterInstanceResource } from 'core-app/features/hal/resources/query-filter-instance-resource';
import { PrincipalsResourceService } from 'core-app/core/state/principals/principals.service';
import { ApiV3ListParameters } from 'core-app/core/apiv3/paths/apiv3-list-resource.interface';
import { WorkPackageResource } from 'core-app/features/hal/resources/work-package-resource';
import { HalResource } from 'core-app/features/hal/resources/hal-resource';
import { UntilDestroyedMixin } from 'core-app/shared/helpers/angular/until-destroyed.mixin';
import { ResourceLabelContentArg } from '@fullcalendar/resource-common';
import { OpCalendarService } from 'core-app/features/calendar/op-calendar.service';
import { WorkPackageCollectionResource } from 'core-app/features/hal/resources/wp-collection-resource';
import { HalResourceEditingService } from 'core-app/shared/components/fields/edit/services/hal-resource-editing.service';
import { HalResourceNotificationService } from 'core-app/features/hal/services/hal-resource-notification.service';
import { SchemaCacheService } from 'core-app/core/schemas/schema-cache.service';

@Component({
  selector: 'op-team-planner',
  templateUrl: './team-planner.component.html',
  styleUrls: ['./team-planner.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    EventViewLookupService,
    OpCalendarService,
  ],
})
export class TeamPlannerComponent extends UntilDestroyedMixin implements OnInit, OnDestroy {
  @ViewChild(FullCalendarComponent) ucCalendar:FullCalendarComponent;

  @ViewChild('ucCalendar', { read: ElementRef })
  set ucCalendarElement(v:ElementRef|undefined) {
    this.calendar.resizeObserver(v);
  }

  @ViewChild('resourceContent') resourceContent:TemplateRef<unknown>;

  @ViewChild('assigneeAutocompleter') assigneeAutocompleter:TemplateRef<unknown>;

  calendarOptions$ = new Subject<CalendarOptions>();

  projectIdentifier:string|undefined = undefined;

  showQuickAddPane = new BehaviorSubject<boolean>(false);

  showAddAssignee$ = new Subject<boolean>();

  private principalIds$ = this.wpTableFilters
    .live$()
    .pipe(
      this.untilDestroyed(),
      map((queryFilters) => {
        const assigneeFilter = queryFilters.find((queryFilter) => queryFilter._type === 'AssigneeQueryFilter');
        return ((assigneeFilter?.values || []) as HalResource[]).map((p) => p.id);
      }),
    );

  private params$ = this.principalIds$
    .pipe(
      this.untilDestroyed(),
      filter((ids) => ids.length > 0),
      map((ids) => ({
        filters: [['id', '=', ids]],
      }) as ApiV3ListParameters),
    );

  assignees:HalResource[] = [];

  text = {
    add_existing: this.I18n.t('js.team_planner.add_existing'),
    assignees: this.I18n.t('js.team_planner.label_assignee_plural'),
    add_assignee: this.I18n.t('js.team_planner.add_assignee'),
    remove_assignee: this.I18n.t('js.team_planner.remove_assignee'),
    noData: this.I18n.t('js.team_planner.no_data'),
    two_weeks: this.I18n.t('js.team_planner.two_weeks'),
  };

  principals$ = this.principalIds$
    .pipe(
      this.untilDestroyed(),
      mergeMap((ids:string[]) => this.principalsResourceService.query.byIds(ids)),
      debounceTime(50),
      distinctUntilChanged((prev, curr) => prev.length === curr.length && prev.length === 0),
    );

  constructor(
    private $state:StateService,
    private configuration:ConfigurationService,
    private principalsResourceService:PrincipalsResourceService,
    private wpTableFilters:WorkPackageViewFiltersService,
    private querySpace:IsolatedQuerySpace,
    private currentProject:CurrentProjectService,
    private viewLookup:EventViewLookupService,
    private I18n:I18nService,
    readonly calendar:OpCalendarService,
    readonly halEditing:HalResourceEditingService,
    readonly halNotification:HalResourceNotificationService,
    readonly schemaCache:SchemaCacheService,
  ) {
    super();
  }

  ngOnInit():void {
    this.initializeCalendar();
    this.projectIdentifier = this.currentProject.identifier || undefined;

    this
      .querySpace
      .results
      .values$()
      .pipe(this.untilDestroyed())
      .subscribe(() => {
        this.ucCalendar.getApi().refetchEvents();
      });

    this.calendar.resize$
      .pipe(
        this.untilDestroyed(),
        debounceTime(50),
      )
      .subscribe(() => {
        this.ucCalendar.getApi().updateSize();
      });

    this.params$
      .pipe(this.untilDestroyed())
      .subscribe((params) => {
        this.principalsResourceService.fetchPrincipals(params).subscribe();
      });

    combineLatest([
      this.principals$,
      this.showAddAssignee$,
    ])
      .pipe(
        this.untilDestroyed(),
        debounceTime(0),
      )
      .subscribe(([principals, showAddAssignee]) => {
        const api = this.ucCalendar.getApi();

        api.getResources().forEach((resource) => resource.remove());

        principals.forEach((principal) => {
          const { self } = principal._links;
          const id = Array.isArray(self) ? self[0].href : self.href;
          api.addResource({
            principal,
            id,
            title: principal.name,
          });
        });

        if (showAddAssignee) {
          api.addResource({
            principal: null,
            id: 'NEW',
            title: '',
          });
        }
      });

    // This needs to be done after all the subscribers are set up
    this.showAddAssignee$.next(false);
  }

  ngOnDestroy():void {
    super.ngOnDestroy();
    this.calendar.resizeObs?.disconnect();
  }

  private initializeCalendar() {
    void this.configuration.initialized
      .then(() => {
        this.calendarOptions$.next(
          this.calendar.calendarOptions({
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
            selectable: true,
            plugins: [
              resourceTimelinePlugin,
              interactionPlugin,
            ],
            titleFormat: {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            },
            initialView: this.calendar.initialView || 'resourceTimelineWeek',
            customButtons: {
              showQuickAddPane: {
                text: this.text.add_existing,
                click: this.toggleQuickAddPane.bind(this),
              },
            },
            headerToolbar: {
              left: 'prev,next today showQuickAddPane',
              center: 'title',
              right: 'resourceTimelineWeek,resourceTimelineTwoWeeks,resourceTimelineMonth',
            },
            views: {
              resourceTimelineWeek: {
                type: 'resourceTimeline',
                duration: { weeks: 1 },
                slotDuration: { days: 1 },
                slotLabelFormat: [
                  {
                    weekday: 'long',
                    day: '2-digit',
                  },
                ],
                resourceAreaColumns: [
                  {
                    field: 'title',
                    headerContent: this.text.assignees,
                  },
                ],
              },
              resourceTimelineTwoWeeks: {
                type: 'resourceTimeline',
                buttonText: this.text.two_weeks,
                duration: { weeks: 2 },
                slotDuration: { days: 1 },
                slotLabelFormat: [
                  {
                    weekday: 'long',
                    day: '2-digit',
                  },
                ],
                resourceAreaColumns: [
                  {
                    field: 'title',
                    headerContent: this.text.assignees,
                  },
                ],
              },
              resourceTimelineMonth: {
                type: 'resourceTimeline',
                duration: { months: 1 },
                slotDuration: { days: 1 },
                slotLabelFormat: [
                  {
                    weekday: 'long',
                    day: '2-digit',
                  },
                ],
                resourceAreaColumns: [
                  {
                    field: 'title',
                    headerContent: this.text.assignees,
                  },
                ],
              },
            },
            events: this.calendarEventsFunction.bind(this) as unknown,
            resources: [],
            resourceAreaWidth: '20%',
            select: this.handleDateClicked.bind(this) as unknown,
            resourceLabelContent: (data:ResourceLabelContentArg) => this.renderTemplate(this.resourceContent, data.resource.id, data),
            resourceLabelWillUnmount: (data:ResourceLabelContentArg) => this.unrenderTemplate(data.resource.id),
            // DnD configuration
            editable: true,
            eventResize: (resizeInfo:EventResizeDoneArg) => this.updateEvent(resizeInfo),
            eventDrop: (dropInfo:EventDropArg) => this.updateEvent(dropInfo),
          } as CalendarOptions),
        );
      });
  }

  public calendarEventsFunction(
    fetchInfo:{ start:Date, end:Date, timeZone:string },
    successCallback:(events:EventInput[]) => void,
    failureCallback:(error:unknown) => void,
  ):void|PromiseLike<EventInput[]> {
    this
      .calendar
      .currentWorkPackages$
      .toPromise()
      .then((workPackages:WorkPackageCollectionResource) => {
        const events = this.mapToCalendarEvents(workPackages.elements);
        successCallback(events);
      })
      .catch(failureCallback);

    this.calendar.updateTimeframe(fetchInfo, this.projectIdentifier);
  }

  renderTemplate(template:TemplateRef<unknown>, id:string, data:ResourceLabelContentArg):{ domNodes:unknown[] } {
    const ref = this.viewLookup.getView(template, id, data);
    return { domNodes: ref.rootNodes };
  }

  unrenderTemplate(id:string):void {
    this.viewLookup.destroyView(id);
  }

  public showAssigneeAddRow():void {
    this.showAddAssignee$.next(true);
    this.ucCalendar.getApi().refetchEvents();
  }

  public addAssignee(principal:HalResource):void {
    this.showAddAssignee$.next(false);

    const modifyFilter = (assigneeFilter:QueryFilterInstanceResource) => {
      // eslint-disable-next-line no-param-reassign
      assigneeFilter.values = [
        ...assigneeFilter.values as HalResource[],
        principal,
      ];
    };

    if (this.wpTableFilters.findIndex('assignee') === -1) {
      // Replace actually also instantiates if it does not exist, which is handy here
      this.wpTableFilters.replace('assignee', modifyFilter.bind(this));
    } else {
      this.wpTableFilters.modify('assignee', modifyFilter.bind(this));
    }
  }

  public removeAssignee(href:string):void {
    const numberOfAssignees = this.wpTableFilters.find('assignee')?.values?.length;
    if (numberOfAssignees && numberOfAssignees <= 1) {
      this.wpTableFilters.remove('assignee');
    } else {
      this.wpTableFilters.modify('assignee', (assigneeFilter:QueryFilterInstanceResource) => {
        // eslint-disable-next-line no-param-reassign
        assigneeFilter.values = (assigneeFilter.values as HalResource[])
          .filter((filterValue) => filterValue.href !== href);
      });
    }
  }

  private mapToCalendarEvents(workPackages:WorkPackageResource[]):EventInput[] {
    return workPackages
      .map((workPackage:WorkPackageResource):EventInput|undefined => {
        if (!workPackage.assignee) {
          return undefined;
        }

        const assignee = this.wpAssignee(workPackage);
        const durationEditable = this.eventDurationEditable(workPackage);
        const resourceEditable = this.eventResourceEditable(workPackage);

        return {
          id: `${workPackage.href as string}-${assignee}`,
          resourceId: assignee,
          editable: durationEditable || resourceEditable,
          durationEditable,
          resourceEditable,
          constraint: this.eventConstaints(workPackage),
          title: workPackage.subject,
          start: this.wpStartDate(workPackage),
          end: this.wpEndDate(workPackage),
          allDay: true,
          className: `__hl_background_type_${workPackage.type.id as string}`,
          workPackage,
        };
      })
      .filter((event) => !!event) as EventInput[];
  }

  private handleDateClicked(info:DateSelectArg) {
    this.openNewSplitCreate(
      info.startStr,
      // end date is exclusive
      moment(info.end).subtract(1, 'd').format('YYYY-MM-DD'),
      info.resource?.id || '',
    );
  }

  // Allow triggering the select from a event, as
  // this is otherwise not testable from selenium
  @HostListener(
    'document:teamPlannerSelectDate',
    ['$event.detail.start', '$event.detail.end', '$event.detail.assignee'],
  )
  openNewSplitCreate(start:string, end:string, resourceHref:string):void {
    const defaults = {
      startDate: start,
      dueDate: end,
      _links: {
        assignee: {
          href: resourceHref,
        },
      },
    };

    void this.$state.go(
      splitViewRoute(this.$state, 'new'),
      {
        defaults,
        tabIdentifier: 'overview',
      },
    );
  }

  private async updateEvent(info:EventResizeDoneArg|EventDropArg):Promise<void> {
    const changeset = this.calendar.updateDates(info);

    const resource = (info as EventDropArg).newResource;
    if (resource) {
      changeset.setValue('assignee', { href: resource.id });
    }

    try {
      const result = await this.halEditing.save(changeset);
      this.halNotification.showSave(result.resource, result.wasNew);
    } catch (e) {
      this.halNotification.showError(e.resource, changeset.projectedResource);
      info.revert();
    }
  }

  private eventResourceEditable(wp:WorkPackageResource):boolean {
    const schema = this.schemaCache.of(wp);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !!schema.assignee?.writable && schema.isAttributeEditable('assignee');
  }

  private eventDurationEditable(wp:WorkPackageResource):boolean {
    const schema = this.schemaCache.of(wp);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const schemaEditable = !!schema.startDate.writable && !!schema.dueDate.writable && schema.isAttributeEditable('startDate');
    return (wp.isLeaf || wp.scheduleManually) && schemaEditable && !this.calendar.isMilestone(wp);
  }

  // Todo: Evaluate whether we really want to use that from a UI perspective ¯\_(ツ)_/¯
  // When users have the right to change the assignee but cannot change the date (due to hierarchy for example),
  // they are forced to drag the wp to the exact same date in the others assignee row. This might be confusing.
  // Without these constraints however, users can drag the WP everywhere, thinking that they changed the date as well.
  // The WP then moves back to the original date when the calendar re-draws again. Also not optimal..
  private eventConstaints(wp:WorkPackageResource):{ [key:string]:string|string[] } {
    const constraints:{ [key:string]:string|string[] } = {};

    if (!this.eventDurationEditable(wp)) {
      constraints.start = this.wpStartDate(wp);
      constraints.end = this.wpEndDate(wp);
    }

    if (!this.eventResourceEditable(wp)) {
      constraints.resourceIds = [this.wpAssignee(wp)];
    }

    return constraints;
  }

  private wpStartDate(wp:WorkPackageResource):string {
    return this.calendar.eventDate(wp, 'start');
  }

  private wpEndDate(wp:WorkPackageResource):string {
    const endDate = this.calendar.eventDate(wp, 'due');
    return moment(endDate).add(1, 'days').format('YYYY-MM-DD');
  }

  private wpAssignee(wp:WorkPackageResource):string {
    return (wp.assignee as HalResource).href as string;
  }

  private toggleQuickAddPane():void {
    document.getElementsByClassName('fc-showQuickAddPane-button')[0].classList.toggle('-active');
    this.showQuickAddPane.next(!this.showQuickAddPane.getValue());
  }
}
