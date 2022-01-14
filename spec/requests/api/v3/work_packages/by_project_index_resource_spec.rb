#-- encoding: UTF-8

#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2020 the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.

require 'spec_helper'
require 'rack/test'

describe API::V3::WorkPackages::WorkPackagesByProjectAPI, type: :request, content_type: :json do
  include Rack::Test::Methods
  include API::V3::Utilities::PathHelper

  let(:role) { create(:role, permissions: permissions) }
  let(:permissions) { [:view_work_packages] }
  let(:project) { create(:project_with_types, public: false) }
  let(:path) { api_v3_paths.work_packages_by_project project.id }
  let(:work_packages) { [] }

  current_user do
    create(:user, member_in_project: project, member_through_role: role)
  end

  subject { last_response }

  before do
    work_packages.each(&:save!)
    get path
  end

  it 'succeeds' do
    expect(subject.status).to eq 200
  end

  context 'when not allowed to see the project' do
    let(:current_user) { build(:user) }

    it 'fails with HTTP Not Found' do
      expect(subject.status).to eq 404
    end
  end

  context 'when not allowed to see work packages' do
    let(:permissions) { [:view_project] }

    it 'fails with HTTP Not Found' do
      expect(subject.status).to eq 403
    end
  end

  describe 'advanced query options' do
    let(:base_path) { api_v3_paths.work_packages_by_project project.id }
    let(:query) { {} }
    let(:path) { "#{base_path}?#{query.to_query}" }

    describe 'sorting' do
      let(:query) { { sortBy: '[["id", "desc"]]' } }
      let(:work_packages) { create_list(:work_package, 2, project: project) }

      it 'returns both elements' do
        expect(subject.body).to be_json_eql(2).at_path('count')
        expect(subject.body).to be_json_eql(2).at_path('total')
      end

      it 'returns work packages in the expected order' do
        first_wp = work_packages.first
        last_wp = work_packages.last

        expect(subject.body).to be_json_eql(last_wp.id).at_path('_embedded/elements/0/id')
        expect(subject.body).to be_json_eql(first_wp.id).at_path('_embedded/elements/1/id')
      end
    end

    describe 'filtering' do
      let(:query) do
        {
          filters: [
            {
              priority: {
                operator: '=',
                values: [priority1.id.to_s]
              }
            }
          ].to_json
        }
      end
      let(:priority1) { create(:priority, name: 'Prio A') }
      let(:priority2) { create(:priority, name: 'Prio B') }
      let(:work_packages) do
        [
          create(:work_package, project: project, priority: priority1),
          create(:work_package, project: project, priority: priority2)
        ]
      end

      it 'returns only one element' do
        expect(subject.body).to be_json_eql(1).at_path('count')
        expect(subject.body).to be_json_eql(1).at_path('total')
      end

      it 'returns the matching element' do
        expected_id = work_packages.first.id
        expect(subject.body).to be_json_eql(expected_id).at_path('_embedded/elements/0/id')
      end
    end

    describe 'grouping' do
      let(:query) { { groupBy: 'priority' } }
      let(:priority1) { build(:priority, name: 'Prio A', position: 2) }
      let(:priority2) { build(:priority, name: 'Prio B', position: 1) }
      let(:work_packages) do
        [
          create(:work_package,
                            project: project,
                            priority: priority1,
                            estimated_hours: 1),
          create(:work_package,
                            project: project,
                            priority: priority2,
                            estimated_hours: 2),
          create(:work_package,
                            project: project,
                            priority: priority1,
                            estimated_hours: 3)
        ]
      end
      let(:expected_group1) do
        {
          _links: {
            valueLink: [{
              href: api_v3_paths.priority(priority1.id)
            }],
            groupBy: {
              href: api_v3_paths.query_group_by('priority'),
              title: 'Priority'
            }
          },
          value: priority1.name,
          count: 2
        }
      end
      let(:expected_group2) do
        {
          _links: {
            valueLink: [{
              href: api_v3_paths.priority(priority2.id)
            }],
            groupBy: {
              href: api_v3_paths.query_group_by('priority'),
              title: 'Priority'
            }
          },
          value: priority2.name,
          count: 1
        }
      end

      it 'returns all elements' do
        expect(subject.body).to be_json_eql(3).at_path('count')
        expect(subject.body).to be_json_eql(3).at_path('total')
      end

      it 'returns work packages ordered by priority' do
        prio1_path = api_v3_paths.priority(priority1.id)
        prio2_path = api_v3_paths.priority(priority2.id)

        expect(subject.body).to(be_json_eql(prio2_path.to_json)
                                  .at_path('_embedded/elements/0/_links/priority/href'))
        expect(subject.body).to(be_json_eql(prio1_path.to_json)
                                  .at_path('_embedded/elements/1/_links/priority/href'))
        expect(subject.body).to(be_json_eql(prio1_path.to_json)
                                  .at_path('_embedded/elements/2/_links/priority/href'))
      end

      it 'contains group elements' do
        expect(subject.body).to include_json(expected_group1.to_json).at_path('groups')
        expect(subject.body).to include_json(expected_group2.to_json).at_path('groups')
      end

      context 'when displaying sums' do
        let(:query) { { groupBy: 'priority', showSums: 'true' } }
        let(:expected_group1) do
          {
            _links: {
              valueLink: [{
                href: api_v3_paths.priority(priority1.id)
              }],
              groupBy: {
                href: api_v3_paths.query_group_by('priority'),
                title: 'Priority'
              }
            },
            value: priority1.name,
            count: 2,
            sums: {
              estimatedTime: 'PT4H',
              laborCosts: "0.00 EUR",
              materialCosts: "0.00 EUR",
              overallCosts: "0.00 EUR",
              remainingTime: nil,
              storyPoints: nil
            }
          }
        end
        let(:expected_group2) do
          {
            _links: {
              valueLink: [{
                href: api_v3_paths.priority(priority2.id)
              }],
              groupBy: {
                href: api_v3_paths.query_group_by('priority'),
                title: 'Priority'
              }
            },
            value: priority2.name,
            count: 1,
            sums: {
              estimatedTime: 'PT2H',
              laborCosts: "0.00 EUR",
              materialCosts: "0.00 EUR",
              overallCosts: "0.00 EUR",
              remainingTime: nil,
              storyPoints: nil
            }
          }
        end

        it 'contains extended group elements' do
          expect(subject.body).to include_json(expected_group1.to_json).at_path('groups')
          expect(subject.body).to include_json(expected_group2.to_json).at_path('groups')
        end
      end
    end

    describe 'displaying sums' do
      let(:query) { { showSums: 'true' } }
      let(:work_packages) do
        [
          create(:work_package, project: project, estimated_hours: 1),
          create(:work_package, project: project, estimated_hours: 2)
        ]
      end

      it 'returns both elements' do
        expect(subject.body).to be_json_eql(2).at_path('count')
        expect(subject.body).to be_json_eql(2).at_path('total')
      end

      it 'contains the sum element' do
        expected = {
          estimatedTime: 'PT3H',
          laborCosts: "0.00 EUR",
          materialCosts: "0.00 EUR",
          overallCosts: "0.00 EUR",
          remainingTime: nil,
          storyPoints: nil
        }

        expect(subject.body).to be_json_eql(expected.to_json).at_path('totalSums')
      end
    end
  end
end
