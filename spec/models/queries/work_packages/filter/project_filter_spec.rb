#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2021 the OpenProject GmbH
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
#++

require 'spec_helper'

describe Queries::WorkPackages::Filter::ProjectFilter, type: :model do
  it_behaves_like 'basic query filter' do
    let(:type) { :list }
    let(:class_key) { :project_id }

    describe '#available?' do
      let(:projects_visible) { true }

      before do
        allow(Project)
          .to receive_message_chain(:visible, :active, :exists?)
                .and_return(projects_visible)
      end

      shared_examples_for 'filter availability' do
        context 'when able to see projects' do
          it 'is true' do
            expect(instance).to be_available
          end
        end

        context 'when not able to see projects' do
          let(:projects_visible) { false }

          it 'is true' do
            expect(instance).not_to be_available
          end
        end
      end

      context 'when inside a project' do
        # Used to be always false hence still checking.
        it_behaves_like 'filter availability'
      end

      context 'when outside of a project ' do
        let(:project) { nil }

        it_behaves_like 'filter availability'
      end
    end

    describe '#allowed_values' do
      let(:project) { nil }

      it 'is an array of group values' do
        parent = FactoryBot.build_stubbed(:project, id: 1)
        child = FactoryBot.build_stubbed(:project, parent: parent, id: 2)

        visible_projects = [parent, child]

        allow(Project)
          .to receive_message_chain(:visible, :active)
          .and_return(visible_projects)

        allow(Project)
          .to receive(:project_tree)
          .with(visible_projects)
          .and_yield(parent, 0)
          .and_yield(child, 1)

        expect(instance.allowed_values)
          .to match_array [[parent.name, parent.id.to_s],
                           ["-- #{child.name}", child.id.to_s]]
      end
    end

    describe '#ar_object_filter?' do
      it 'is true' do
        expect(instance)
          .to be_ar_object_filter
      end
    end

    describe '#value_objects' do
      let(:project) { FactoryBot.build_stubbed(:project) }
      let(:project2) { FactoryBot.build_stubbed(:project) }

      before do
        allow(Project)
          .to receive_message_chain(:visible, :active)
          .and_return([project, project2])

        instance.values = [project.id.to_s]
      end

      it 'returns an array of projects' do
        expect(instance.value_objects)
          .to match_array([project])
      end
    end
  end
end
