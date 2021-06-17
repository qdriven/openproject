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
# See docs/COPYRIGHT.rdoc for more details.

shared_examples 'represents the event' do
  it :aggregate_failures do
    expect(last_response.status).to eq(200)
    expect(last_response.body)
      .to(be_json_eql('Event'.to_json).at_path('_type'))

    expect(last_response.body)
      .to(be_json_eql(event.subject.to_json).at_path('subject'))

    expect(last_response.body)
      .to(be_json_eql(event.read_iam.to_json).at_path('readIam'))

    expect(last_response.body)
      .to(be_json_eql(event.read_email.to_json).at_path('readEmail'))

    expect(last_response.body)
      .to(be_json_eql(::API::V3::Utilities::DateTimeFormatter.format_datetime(event.created_at).to_json).at_path('createdAt'))

    expect(last_response.body)
      .to(be_json_eql(::API::V3::Utilities::DateTimeFormatter.format_datetime(event.updated_at).to_json).at_path('updatedAt'))

    expect(last_response.body)
      .to(be_json_eql(event.id.to_json).at_path('id'))
  end
end