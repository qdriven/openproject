import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIRouterModule } from '@uirouter/angular';
import { DynamicModule } from 'ng-dynamic-component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { IconModule } from 'core-app/shared/components/icon/icon.module';
import { OpenprojectAutocompleterModule } from 'core-app/shared/components/autocompleter/openproject-autocompleter.module';
import { OpenprojectPrincipalRenderingModule } from 'core-app/shared/components/principal/principal-rendering.module';
import { OpenprojectWorkPackagesModule } from 'core-app/features/work-packages/openproject-work-packages.module';
import { TEAM_PLANNER_ROUTES } from 'core-app/features/team-planner/team-planner/team-planner.routes';
import { TeamPlannerComponent } from 'core-app/features/team-planner/team-planner/planner/team-planner.component';
import { AddAssigneeComponent } from 'core-app/features/team-planner/team-planner/assignee/add-assignee.component';
import { TeamPlannerPageComponent } from 'core-app/features/team-planner/team-planner/page/team-planner-page.component';
import { OPSharedModule } from 'core-app/shared/shared.module';
import { QuickAddPaneComponent } from './add-work-packages/quick-add-pane.component';
import { OpenprojectContentLoaderModule } from 'core-app/shared/components/op-content-loader/openproject-content-loader.module';

@NgModule({
  declarations: [
    TeamPlannerComponent,
    TeamPlannerPageComponent,
    AddAssigneeComponent,
    QuickAddPaneComponent,
  ],
  imports: [
    OPSharedModule,
    // Routes for /team_planner
    UIRouterModule.forChild({
      states: TEAM_PLANNER_ROUTES,
    }),
    DynamicModule,
    CommonModule,
    IconModule,
    OpenprojectPrincipalRenderingModule,
    OpenprojectWorkPackagesModule,
    FullCalendarModule,
    // Autocompleters
    OpenprojectAutocompleterModule,
    OpenprojectContentLoaderModule,
  ],
})
export class TeamPlannerModule {}
